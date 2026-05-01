package aiclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

type chatStreamLine struct {
	Message struct {
		Content  string `json:"content,omitempty"`
		Thinking string `json:"thinking,omitempty"`
	} `json:"message"`
	Done  bool   `json:"done,omitempty"`
	Error string `json:"error,omitempty"`
}

func contentLine(content string) chatStreamLine {
	var l chatStreamLine
	l.Message.Content = content
	return l
}

func thinkingLine(thinking string) chatStreamLine {
	var l chatStreamLine
	l.Message.Thinking = thinking
	return l
}

func doneLine() chatStreamLine {
	return chatStreamLine{Done: true}
}

func errLine(msg string) chatStreamLine {
	return chatStreamLine{Error: msg}
}

func encodeChatLines(t *testing.T, lines ...chatStreamLine) []string {
	t.Helper()
	out := make([]string, len(lines))
	for i, l := range lines {
		b, err := json.Marshal(l)
		if err != nil {
			t.Fatalf("marshal: %v", err)
		}
		out[i] = string(b)
	}
	return out
}

func newStreamingChatServer(t *testing.T, lines []string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/chat" {
			t.Errorf("unexpected path: %s", r.URL.Path)
			http.NotFound(w, r)
			return
		}
		if r.Method != http.MethodPost {
			t.Errorf("unexpected method: %s", r.Method)
		}
		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatalf("ResponseWriter does not support flushing")
		}
		w.Header().Set("Content-Type", "application/x-ndjson")
		w.WriteHeader(http.StatusOK)
		for _, line := range lines {
			_, _ = fmt.Fprintln(w, line)
			flusher.Flush()
		}
	}))
}

func TestChatStream_HappyPath(t *testing.T) {
	lines := encodeChatLines(t,
		contentLine("Hello"),
		contentLine(", "),
		contentLine("world"),
		doneLine(),
	)
	srv := newStreamingChatServer(t, lines)
	defer srv.Close()

	var chunks, thinking []string
	client := NewClient()
	full, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test", Messages: []ChatMessage{{Role: "user", Content: "hi"}}},
		func(s string) { chunks = append(chunks, s) },
		func(s string) { thinking = append(thinking, s) },
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if full != "Hello, world" {
		t.Fatalf("full=%q want=%q", full, "Hello, world")
	}
	if got, want := strings.Join(chunks, ""), "Hello, world"; got != want {
		t.Fatalf("chunks=%q want=%q", got, want)
	}
	if len(thinking) != 0 {
		t.Fatalf("expected no thinking chunks, got %d", len(thinking))
	}
}

func TestChatStream_ThinkingChunks(t *testing.T) {
	lines := encodeChatLines(t,
		thinkingLine("reason 1"),
		thinkingLine("reason 2"),
		contentLine("answer"),
		doneLine(),
	)
	srv := newStreamingChatServer(t, lines)
	defer srv.Close()

	var chunks, thinking []string
	client := NewClient()
	full, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		func(s string) { chunks = append(chunks, s) },
		func(s string) { thinking = append(thinking, s) },
	)
	if err != nil {
		t.Fatalf("unexpected: %v", err)
	}
	if full != "answer" {
		t.Fatalf("full=%q", full)
	}
	if got, want := strings.Join(thinking, "|"), "reason 1|reason 2"; got != want {
		t.Fatalf("thinking=%q want=%q", got, want)
	}
	if got, want := strings.Join(chunks, ""), "answer"; got != want {
		t.Fatalf("chunks=%q want=%q", got, want)
	}
}

func TestChatStream_ThinkingWatchdog(t *testing.T) {
	n := maxThinkingChunks + 5
	rows := make([]chatStreamLine, n)
	for i := range rows {
		rows[i] = thinkingLine("loop")
	}
	lines := encodeChatLines(t, rows...)
	srv := newStreamingChatServer(t, lines)
	defer srv.Close()

	client := NewClient()
	_, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		nil, nil,
	)
	if err == nil {
		t.Fatalf("expected watchdog error, got nil")
	}
	if !strings.Contains(err.Error(), "reasoning loop detected") {
		t.Fatalf("expected reasoning-loop error, got: %v", err)
	}
}

func TestChatStream_LineError(t *testing.T) {
	lines := encodeChatLines(t,
		contentLine("partial"),
		errLine("model is busy"),
	)
	srv := newStreamingChatServer(t, lines)
	defer srv.Close()

	client := NewClient()
	_, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		nil, nil,
	)
	if err == nil || err.Error() != "model is busy" {
		t.Fatalf("expected line error 'model is busy', got: %v", err)
	}
}

func TestChatStream_EmptyStream(t *testing.T) {
	srv := newStreamingChatServer(t, nil)
	defer srv.Close()

	client := NewClient()
	_, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		nil, nil,
	)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "ended with no data") {
		t.Fatalf("expected ended-with-no-data error, got: %v", err)
	}
}

func TestChatStream_EmptyStreamWithCtxCancel(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
		<-r.Context().Done()
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	client := NewClient()
	_, err := client.ChatStream(ctx,
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		nil, nil,
	)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	msg := err.Error()
	if !strings.Contains(msg, "context") && !strings.Contains(msg, "canceled") && !strings.Contains(msg, "deadline") {
		t.Fatalf("expected context-related error, got: %v", err)
	}
}

func TestChatStream_Non200Status(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte("server exploded"))
	}))
	defer srv.Close()

	client := NewClient()
	_, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderOllama, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		nil, nil,
	)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "500") {
		t.Fatalf("expected 500 in error, got: %v", err)
	}
	if !strings.Contains(err.Error(), "server exploded") {
		t.Fatalf("expected body in error, got: %v", err)
	}
}

func TestChatStream_FallbackToOpenAI(t *testing.T) {
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		if r.URL.Path != "/v1/chat/completions" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		body := map[string]any{
			"choices": []map[string]any{
				{"message": map[string]any{"content": "openai response"}},
			},
		}
		_ = json.NewEncoder(w).Encode(body)
	}))
	defer srv.Close()

	var chunks []string
	client := NewClient()
	full, err := client.ChatStream(context.Background(),
		Provider{Name: ProviderLlamafile, BaseURL: srv.URL},
		ChatRequest{Model: "test"},
		func(s string) { chunks = append(chunks, s) },
		nil,
	)
	if err != nil {
		t.Fatalf("unexpected: %v", err)
	}
	if full != "openai response" {
		t.Fatalf("full=%q", full)
	}
	if len(chunks) != 1 || chunks[0] != "openai response" {
		t.Fatalf("expected single chunk, got %v", chunks)
	}
	if got := calls.Load(); got != 1 {
		t.Fatalf("expected 1 call, got %d", got)
	}
}

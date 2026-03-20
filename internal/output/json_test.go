package output

import (
	"encoding/json"
	"testing"

	"github.com/rea9r/apidiff/internal/diff"
)

func TestFormatJSON(t *testing.T) {
	diffs := []diff.Diff{
		{Type: diff.Added, Path: "user.phone", NewValue: "090"},
		{Type: diff.Removed, Path: "user.email", OldValue: "a@example.com"},
		{Type: diff.Changed, Path: "user.name", OldValue: "Taro", NewValue: "Hanako"},
		{Type: diff.TypeChanged, Path: "user.age", OldValue: "20", NewValue: json.Number("20")},
	}

	out, err := FormatJSON(diffs)
	if err != nil {
		t.Fatalf("FormatJSON returned error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("failed to parse output json: %v", err)
	}

	summary, ok := parsed["summary"].(map[string]any)
	if !ok {
		t.Fatalf("summary was not an object: %#v", parsed["summary"])
	}

	assertCount(t, summary, "added", 1)
	assertCount(t, summary, "removed", 1)
	assertCount(t, summary, "changed", 1)
	assertCount(t, summary, "type_changed", 1)
}

func assertCount(t *testing.T, summary map[string]any, key string, want float64) {
	t.Helper()

	got, ok := summary[key].(float64)
	if !ok {
		t.Fatalf("%s was not a number: %#v", key, summary[key])
	}
	if got != want {
		t.Fatalf("%s mismatch: got=%v want=%v", key, got, want)
	}
}

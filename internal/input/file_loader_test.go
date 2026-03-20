package input

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestLoadJSONFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "sample.json")
	if err := os.WriteFile(path, []byte(`{"age":20}`), 0o644); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}

	got, err := LoadJSONFile(path)
	if err != nil {
		t.Fatalf("LoadJSONFile returned error: %v", err)
	}

	obj, ok := got.(map[string]any)
	if !ok {
		t.Fatalf("result was not object: %#v", got)
	}
	if _, ok := obj["age"].(json.Number); !ok {
		t.Fatalf("age type mismatch: got=%T want=json.Number", obj["age"])
	}
}

func TestLoadJSONFile_InvalidJSON(t *testing.T) {
	path := filepath.Join(t.TempDir(), "invalid.json")
	if err := os.WriteFile(path, []byte(`{"a":1}{"b":2}`), 0o644); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}

	_, err := LoadJSONFile(path)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

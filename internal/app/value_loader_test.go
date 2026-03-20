package app

import (
	"errors"
	"testing"
)

func TestRunWithValueLoaders_OldLoaderError(t *testing.T) {
	wantErr := errors.New("old load failed")

	code, out, err := RunWithValueLoaders(
		func() (any, error) { return nil, wantErr },
		func() (any, error) { return map[string]any{}, nil },
		CompareOptions{Format: "text", FailOn: FailOnAny},
	)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Fatalf("error mismatch: got=%v want=%v", err, wantErr)
	}
	if code != exitError {
		t.Fatalf("exit code mismatch: got=%d want=%d", code, exitError)
	}
	if out != "" {
		t.Fatalf("expected empty output on error, got: %q", out)
	}
}

func TestRunWithValueLoaders_NewLoaderError(t *testing.T) {
	wantErr := errors.New("new load failed")

	code, out, err := RunWithValueLoaders(
		func() (any, error) { return map[string]any{}, nil },
		func() (any, error) { return nil, wantErr },
		CompareOptions{Format: "text", FailOn: FailOnAny},
	)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Fatalf("error mismatch: got=%v want=%v", err, wantErr)
	}
	if code != exitError {
		t.Fatalf("exit code mismatch: got=%d want=%d", code, exitError)
	}
	if out != "" {
		t.Fatalf("expected empty output on error, got: %q", out)
	}
}

package runner

import (
	"testing"

	"github.com/rea9r/xdiff/internal/delta"
)

func TestRunWithDiffs_FailOnBreaking(t *testing.T) {
	diffs := []delta.Diff{
		{Type: delta.Added, Path: "paths./users.post"},
	}

	code, out, err := RunDeltaDiffs(diffs, CompareOptions{
		Format: "text",
		FailOn: FailOnBreaking,
	})
	if err != nil {
		t.Fatalf("RunDeltaDiffs returned error: %v", err)
	}
	if code != exitOK {
		t.Fatalf("exit code mismatch: got=%d want=%d", code, exitOK)
	}
	if out == "" {
		t.Fatalf("expected non-empty output")
	}
}

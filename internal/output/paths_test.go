package output

import (
	"testing"

	"github.com/rea9r/xdiff/internal/delta"
)

func TestRenderPaths_UniqueAndSorted(t *testing.T) {
	diffs := []delta.Diff{
		{Path: "user.z"},
		{Path: "user.a"},
		{Path: "user.z"},
		{Path: "items[2]"},
	}

	got := RenderPaths(diffs)
	want := "items[2]\nuser.a\nuser.z\n"
	if got != want {
		t.Fatalf("unexpected paths output\nwant:\n%s\ngot:\n%s", want, got)
	}
}

func TestRenderPaths_EmptyDiffs(t *testing.T) {
	if got := RenderPaths(nil); got != "" {
		t.Fatalf("expected empty output, got: %q", got)
	}
}

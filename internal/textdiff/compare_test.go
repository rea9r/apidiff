package textdiff

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/rea9r/xdiff/internal/delta"
)

func TestCompare_NoDiff(t *testing.T) {
	got := Compare("hello\nworld\n", "hello\nworld\n")
	if len(got) != 0 {
		t.Fatalf("expected no diffs, got=%v", got)
	}
}

func TestCompare_ReplaceLine(t *testing.T) {
	got := Compare("hello\nworld\n", "hello\ngopher\n")
	want := []delta.Diff{
		{Type: delta.Removed, Path: "line[2]", OldValue: "world"},
		{Type: delta.Added, Path: "line[2]", NewValue: "gopher"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("diff mismatch (-want +got):\n%s", d)
	}
}

func TestCompare_InsertLine(t *testing.T) {
	got := Compare("a\nc\n", "a\nb\nc\n")
	want := []delta.Diff{
		{Type: delta.Added, Path: "line[2]", NewValue: "b"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("diff mismatch (-want +got):\n%s", d)
	}
}

func TestCompareWithDisplay_PreservesOriginalLines(t *testing.T) {
	dispOld := "Hello   World\nfoo\n"
	dispNew := "Hello World\nbar\n"
	cmpOld := Normalize(dispOld, NormalizeOptions{IgnoreWhitespace: true})
	cmpNew := Normalize(dispNew, NormalizeOptions{IgnoreWhitespace: true})

	got := CompareWithDisplay(cmpOld, cmpNew, dispOld, dispNew)
	// Whitespace-only difference on line 1 is treated as equal; line 2
	// changes. OldValue/NewValue must come from the original (display)
	// text, not the normalized one.
	want := []delta.Diff{
		{Type: delta.Removed, Path: "line[2]", OldValue: "foo"},
		{Type: delta.Added, Path: "line[2]", NewValue: "bar"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("diff mismatch (-want +got):\n%s", d)
	}
}

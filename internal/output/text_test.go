package output

import (
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/rea9r/xdiff/internal/delta"
	"github.com/rea9r/xdiff/internal/textdiff"
)

func TestFormatText_Golden(t *testing.T) {
	got := FormatText(sampleDiffs())
	want := readGolden(t, "sample_text.golden")

	if diff := cmp.Diff(want, got); diff != "" {
		t.Fatalf("text output mismatch (-want +got):\n%s", diff)
	}
}

func TestRenderSemanticText_UsesRawPath(t *testing.T) {
	diffs := []delta.Diff{
		{Type: delta.Added, Path: "paths./users.post", NewValue: "operation"},
	}

	got := RenderSemanticText(diffs)

	if got != "+ paths./users.post: \"operation\"\n" {
		t.Fatalf("expected raw path output, got: %q", got)
	}
}

func TestRenderUnifiedTextWithDisplay_ShowsOriginalWhitespace(t *testing.T) {
	dispOld := "Hello   World\nfoo\nend\n"
	dispNew := "Hello World\nbar\nend\n"
	cmpOld := textdiff.Normalize(dispOld, textdiff.NormalizeOptions{IgnoreWhitespace: true})
	cmpNew := textdiff.Normalize(dispNew, textdiff.NormalizeOptions{IgnoreWhitespace: true})

	got := RenderUnifiedTextWithDisplay(dispOld, dispNew, cmpOld, cmpNew)

	// The whitespace-only difference on line 1 should be a context line
	// that preserves the original spacing, not the collapsed form.
	if !strings.Contains(got, " Hello   World\n") {
		t.Fatalf("expected original spacing preserved on context line, got:\n%s", got)
	}
	// foo→bar is the actual change.
	if !strings.Contains(got, "-foo\n") || !strings.Contains(got, "+bar\n") {
		t.Fatalf("expected foo→bar replace block, got:\n%s", got)
	}
	// The collapsed "Hello World" must NOT appear.
	if strings.Contains(got, "Hello World\n") && !strings.Contains(got, "Hello   World\n") {
		t.Fatalf("collapsed form leaked into output:\n%s", got)
	}
}

func TestRenderUnifiedTextWithDisplay_NoDiff(t *testing.T) {
	got := RenderUnifiedTextWithDisplay("a\nb\n", "a\nb\n", "a\nb\n", "a\nb\n")
	if got != "" {
		t.Fatalf("expected empty output for no-diff, got: %q", got)
	}
}

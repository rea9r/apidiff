package output

import (
	"testing"

	"github.com/google/go-cmp/cmp"
)

func TestFormatText_Golden(t *testing.T) {
	got := FormatText(sampleDiffs())
	want := readGolden(t, "sample_text.golden")

	if diff := cmp.Diff(want, got); diff != "" {
		t.Fatalf("text output mismatch (-want +got):\n%s", diff)
	}
}

package textdiff

import (
	"fmt"
	"strings"

	"github.com/pmezard/go-difflib/difflib"
	"github.com/rea9r/xdiff/internal/delta"
)

type NormalizeOptions struct {
	IgnoreWhitespace bool
	IgnoreCase       bool
	IgnoreEOL        bool
}

func Normalize(text string, opts NormalizeOptions) string {
	if opts.IgnoreEOL {
		text = strings.ReplaceAll(text, "\r\n", "\n")
		text = strings.ReplaceAll(text, "\r", "\n")
	}
	if opts.IgnoreWhitespace {
		lines := strings.Split(text, "\n")
		for i, line := range lines {
			lines[i] = strings.Join(strings.Fields(line), " ")
		}
		text = strings.Join(lines, "\n")
	}
	if opts.IgnoreCase {
		text = strings.ToLower(text)
	}
	return text
}

func Compare(oldText, newText string) []delta.Diff {
	return CompareWithDisplay(oldText, newText, oldText, newText)
}

// CompareWithDisplay matches lines using compareOld/compareNew but emits
// OldValue/NewValue from displayOld/displayNew. The caller must keep line
// counts identical between the compare and display sides (Normalize is
// line-preserving, so feeding normalized text on the compare side and the
// original on the display side is safe).
func CompareWithDisplay(compareOld, compareNew, displayOld, displayNew string) []delta.Diff {
	cmpOld := difflib.SplitLines(compareOld)
	cmpNew := difflib.SplitLines(compareNew)
	dispOld := difflib.SplitLines(displayOld)
	dispNew := difflib.SplitLines(displayNew)

	matcher := difflib.NewMatcher(cmpOld, cmpNew)
	opCodes := matcher.GetOpCodes()

	out := make([]delta.Diff, 0)
	for _, op := range opCodes {
		switch op.Tag {
		case 'd':
			for i := op.I1; i < op.I2; i++ {
				out = append(out, delta.Diff{
					Type:     delta.Removed,
					Path:     linePath(i + 1),
					OldValue: normalizeLine(dispOld[i]),
				})
			}
		case 'i':
			for j := op.J1; j < op.J2; j++ {
				out = append(out, delta.Diff{
					Type:     delta.Added,
					Path:     linePath(j + 1),
					NewValue: normalizeLine(dispNew[j]),
				})
			}
		case 'r':
			for i := op.I1; i < op.I2; i++ {
				out = append(out, delta.Diff{
					Type:     delta.Removed,
					Path:     linePath(i + 1),
					OldValue: normalizeLine(dispOld[i]),
				})
			}
			for j := op.J1; j < op.J2; j++ {
				out = append(out, delta.Diff{
					Type:     delta.Added,
					Path:     linePath(j + 1),
					NewValue: normalizeLine(dispNew[j]),
				})
			}
		}
	}

	return out
}

func linePath(line int) string {
	return fmt.Sprintf("line[%d]", line)
}

func normalizeLine(line string) string {
	return strings.TrimSuffix(line, "\n")
}

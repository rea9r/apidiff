package output

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/pmezard/go-difflib/difflib"
	"github.com/rea9r/xdiff/internal/delta"
)

func FormatText(diffs []delta.Diff) string {
	return RenderSemanticText(diffs)
}

func RenderSemanticText(diffs []delta.Diff) string {
	var b strings.Builder

	if len(diffs) == 0 {
		b.WriteString("No differences.\n")
	} else {
		for _, d := range diffs {
			path := d.Path
			if path == "" {
				path = "(root)"
			}

			detail := formatDetail(d)
			fmt.Fprintf(&b, "%s %s: %s\n", diffMarker(d.Type), path, detail)
		}
	}
	return b.String()
}

func RenderUnifiedJSON(oldValue, newValue any) string {
	return RenderUnifiedText(prettyJSON(oldValue), prettyJSON(newValue))
}

func RenderUnifiedText(oldText, newText string) string {
	ud := difflib.UnifiedDiff{
		A:        difflib.SplitLines(oldText),
		B:        difflib.SplitLines(newText),
		FromFile: "old",
		ToFile:   "new",
		Context:  3,
	}
	unified, err := difflib.GetUnifiedDiffString(ud)
	if err != nil {
		return "failed to render unified diff\n"
	}
	return unified
}

// RenderUnifiedTextWithDisplay matches lines using compareOld/compareNew but
// emits the corresponding lines from displayOld/displayNew in the unified
// output. Caller must keep line counts identical between compare and display
// sides.
func RenderUnifiedTextWithDisplay(displayOld, displayNew, compareOld, compareNew string) string {
	cmpA := difflib.SplitLines(compareOld)
	cmpB := difflib.SplitLines(compareNew)
	dispA := difflib.SplitLines(displayOld)
	dispB := difflib.SplitLines(displayNew)

	matcher := difflib.NewMatcher(cmpA, cmpB)
	groups := matcher.GetGroupedOpCodes(3)
	if len(groups) == 0 {
		return ""
	}

	var b strings.Builder
	b.WriteString("--- old\n")
	b.WriteString("+++ new\n")
	for _, group := range groups {
		first := group[0]
		last := group[len(group)-1]
		fmt.Fprintf(&b, "@@ -%s +%s @@\n",
			formatRangeUnified(first.I1, last.I2),
			formatRangeUnified(first.J1, last.J2),
		)
		for _, op := range group {
			switch op.Tag {
			case 'e':
				for _, line := range dispA[op.I1:op.I2] {
					b.WriteByte(' ')
					b.WriteString(line)
				}
			case 'r':
				for _, line := range dispA[op.I1:op.I2] {
					b.WriteByte('-')
					b.WriteString(line)
				}
				for _, line := range dispB[op.J1:op.J2] {
					b.WriteByte('+')
					b.WriteString(line)
				}
			case 'd':
				for _, line := range dispA[op.I1:op.I2] {
					b.WriteByte('-')
					b.WriteString(line)
				}
			case 'i':
				for _, line := range dispB[op.J1:op.J2] {
					b.WriteByte('+')
					b.WriteString(line)
				}
			}
		}
	}
	return b.String()
}

func formatRangeUnified(start, stop int) string {
	beginning := start + 1
	length := stop - start
	if length == 1 {
		return fmt.Sprintf("%d", beginning)
	}
	if length == 0 {
		beginning--
	}
	return fmt.Sprintf("%d,%d", beginning, length)
}

func formatDetail(d delta.Diff) string {
	switch d.Type {
	case delta.Added:
		return formatValue(d.NewValue)
	case delta.Removed:
		return formatValue(d.OldValue)
	case delta.TypeChanged:
		return fmt.Sprintf("%s -> %s", delta.ValueType(d.OldValue), delta.ValueType(d.NewValue))
	case delta.Changed:
		return fmt.Sprintf("%s -> %s", formatValue(d.OldValue), formatValue(d.NewValue))
	default:
		return ""
	}
}

func formatValue(v any) string {
	data, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprintf("%v", v)
	}
	return string(data)
}

func prettyJSON(v any) string {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprintf("%v\n", v)
	}
	return string(data) + "\n"
}

func diffMarker(typ delta.DiffType) string {
	switch typ {
	case delta.Added:
		return "+"
	case delta.Removed:
		return "-"
	case delta.Changed:
		return "~"
	case delta.TypeChanged:
		return "!"
	default:
		return "?"
	}
}

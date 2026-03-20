package output

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/rea9r/apidiff/internal/diff"
)

func FormatText(diffs []diff.Diff) string {
	return FormatTextWithOptions(diffs, TextOptions{Color: false})
}

type TextOptions struct {
	Color bool
}

func FormatTextWithOptions(diffs []diff.Diff, opts TextOptions) string {
	summary := diff.Summarize(diffs)

	var b strings.Builder

	if len(diffs) == 0 {
		b.WriteString("No differences.\n")
	} else {
		for _, d := range diffs {
			action := colorizeAction(strings.ToUpper(string(d.Type)), d.Type, opts.Color)
			path := d.Path
			if path == "" {
				path = "(root)"
			}

			detail := formatDetail(d)
			fmt.Fprintf(&b, "%-12s %-30s %s\n", action, path, detail)
		}
	}

	b.WriteString("\nSummary:\n")
	fmt.Fprintf(&b, "  added: %d\n", summary.Added)
	fmt.Fprintf(&b, "  removed: %d\n", summary.Removed)
	fmt.Fprintf(&b, "  changed: %d\n", summary.Changed)
	fmt.Fprintf(&b, "  type_changed: %d\n", summary.TypeChanged)

	return b.String()
}

func formatDetail(d diff.Diff) string {
	switch d.Type {
	case diff.Added:
		return formatValue(d.NewValue)
	case diff.Removed:
		return formatValue(d.OldValue)
	case diff.TypeChanged:
		return fmt.Sprintf("%s -> %s", diff.ValueType(d.OldValue), diff.ValueType(d.NewValue))
	case diff.Changed:
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

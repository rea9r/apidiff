package output

import (
	"fmt"

	"github.com/rea9r/apidiff/internal/diff"
)

func Format(diffs []diff.Diff, format string) (string, error) {
	switch format {
	case "text":
		return FormatText(diffs), nil
	case "json":
		return FormatJSON(diffs)
	default:
		return "", fmt.Errorf("unsupported format %q", format)
	}
}

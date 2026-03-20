package output

import (
	"fmt"

	"github.com/rea9r/apidiff/internal/diff"
)

const (
	TextFormat = "text"
	JSONFormat = "json"
)

type Options struct {
	Format string
	Color  bool
}

func Format(diffs []diff.Diff, format string) (string, error) {
	return FormatWithOptions(diffs, Options{
		Format: format,
		Color:  false,
	})
}

func FormatWithOptions(diffs []diff.Diff, opts Options) (string, error) {
	switch opts.Format {
	case TextFormat:
		return FormatTextWithOptions(diffs, TextOptions{Color: opts.Color}), nil
	case JSONFormat:
		return FormatJSON(diffs)
	default:
		return "", fmt.Errorf("unsupported format %q", opts.Format)
	}
}

func IsSupportedFormat(format string) bool {
	return format == TextFormat || format == JSONFormat
}

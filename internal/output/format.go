package output

import (
	"fmt"

	"github.com/rea9r/xdiff/internal/delta"
)

const (
	TextFormat = "text"
	JSONFormat = "json"
)

type Options struct {
	Format string
	Color  bool
}

func Format(diffs []delta.Diff, format string) (string, error) {
	return FormatWithOptions(diffs, Options{
		Format: format,
		Color:  false,
	})
}

func FormatWithOptions(diffs []delta.Diff, opts Options) (string, error) {
	switch opts.Format {
	case TextFormat:
		return RenderTextWithOptions(nil, nil, diffs, TextOptions{Color: opts.Color}), nil
	case JSONFormat:
		return RenderJSON(diffs)
	default:
		return "", fmt.Errorf("unsupported format %q", opts.Format)
	}
}

func FormatResultWithOptions(oldValue, newValue any, diffs []delta.Diff, opts Options) (string, error) {
	switch opts.Format {
	case TextFormat:
		return RenderTextWithOptions(oldValue, newValue, diffs, TextOptions{Color: opts.Color}), nil
	case JSONFormat:
		return RenderJSON(diffs)
	default:
		return "", fmt.Errorf("unsupported format %q", opts.Format)
	}
}

func IsSupportedFormat(format string) bool {
	return format == TextFormat || format == JSONFormat
}

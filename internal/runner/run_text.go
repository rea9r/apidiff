package runner

import (
	"github.com/rea9r/xdiff/internal/delta"
	"github.com/rea9r/xdiff/internal/output"
	"github.com/rea9r/xdiff/internal/textdiff"
)

func RunTextValuesDetailed(oldText, newText string, opts DiffOptions) RunResult {
	if err := validateDiffOptions(opts); err != nil {
		return finalizeRun(nil, "", err)
	}

	normOpts := textdiff.NormalizeOptions{
		IgnoreWhitespace: opts.IgnoreWhitespace,
		IgnoreCase:       opts.IgnoreCase,
		IgnoreEOL:        opts.IgnoreEOL,
	}
	cmpOldText := textdiff.Normalize(oldText, normOpts)
	cmpNewText := textdiff.Normalize(newText, normOpts)

	diffs := textdiff.CompareWithDisplay(cmpOldText, cmpNewText, oldText, newText)
	filtered := delta.ApplyOptions(diffs, delta.Options{
		IgnorePaths: opts.IgnorePaths,
	})

	var out string
	switch opts.Format {
	case output.TextFormat:
		style, err := resolveTextDiffStyle(opts)
		if err != nil {
			return finalizeRun(filtered, "", err)
		}

		if len(filtered) == 0 {
			out = "No differences.\n"
			break
		}

		if style == TextStyleSemantic {
			out = output.RenderSemanticText(filtered)
		} else {
			out = output.RenderUnifiedTextWithDisplay(oldText, newText, cmpOldText, cmpNewText)
		}
	case output.JSONFormat:
		rendered, err := output.RenderJSON(filtered)
		if err != nil {
			return finalizeRun(filtered, "", err)
		}
		out = rendered
	}

	return finalizeRun(filtered, out, nil)
}

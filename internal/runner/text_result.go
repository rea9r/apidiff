package runner

import (
	"github.com/rea9r/xdiff/internal/delta"
	"github.com/rea9r/xdiff/internal/output"
)

func decorateTextResult(format, failOn string, hasFailure bool, diffs []delta.Diff, body string) string {
	if format != output.TextFormat {
		return body
	}
	return body
}

package output

import (
	"sort"
	"strings"

	"github.com/rea9r/xdiff/internal/delta"
)

func RenderPaths(diffs []delta.Diff) string {
	if len(diffs) == 0 {
		return ""
	}

	seen := make(map[string]struct{}, len(diffs))
	paths := make([]string, 0, len(diffs))
	for _, diff := range diffs {
		if _, ok := seen[diff.Path]; ok {
			continue
		}
		seen[diff.Path] = struct{}{}
		paths = append(paths, diff.Path)
	}

	sort.Strings(paths)
	return strings.Join(paths, "\n") + "\n"
}

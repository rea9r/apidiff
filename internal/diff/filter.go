package diff

func FilterIgnoredPaths(diffs []Diff, ignorePaths []string) []Diff {
	if len(ignorePaths) == 0 || len(diffs) == 0 {
		return diffs
	}

	ignoreSet := make(map[string]struct{}, len(ignorePaths))
	for _, path := range ignorePaths {
		ignoreSet[path] = struct{}{}
	}

	filtered := make([]Diff, 0, len(diffs))
	for _, d := range diffs {
		if _, ignored := ignoreSet[d.Path]; ignored {
			continue
		}
		filtered = append(filtered, d)
	}
	return filtered
}

func FilterOnlyBreaking(diffs []Diff) []Diff {
	if len(diffs) == 0 {
		return diffs
	}

	filtered := make([]Diff, 0, len(diffs))
	for _, d := range diffs {
		if !IsBreaking(d.Type) {
			continue
		}
		filtered = append(filtered, d)
	}
	return filtered
}

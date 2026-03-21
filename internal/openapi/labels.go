package openapi

import (
	"strings"

	"github.com/rea9r/xdiff/internal/delta"
)

func LabelDiffPaths(diffs []delta.Diff) []delta.Diff {
	if len(diffs) == 0 {
		return diffs
	}

	labeled := make([]delta.Diff, 0, len(diffs))
	for _, d := range diffs {
		clone := d
		clone.Path = humanizePath(d.Path)
		labeled = append(labeled, clone)
	}
	return labeled
}

func humanizePath(path string) string {
	apiPath, method, rest, ok := parseMethodPath(path)
	if !ok {
		return path
	}

	switch rest {
	case "":
		return method + " " + apiPath
	case ".requestBody.required":
		return method + " " + apiPath + " request body required"
	}

	const responsePrefix = ".responses."
	if strings.HasPrefix(rest, responsePrefix) {
		parts := strings.Split(rest[len(responsePrefix):], ".")
		if len(parts) >= 5 && parts[1] == "content" {
			statusCode := parts[0]
			contentType := parts[2]
			detail := strings.Join(parts[3:], ".")
			if detail == "schema.type" {
				return method + " " + apiPath + " response " + statusCode + " " + contentType + " schema type"
			}
		}
	}

	return path
}

func parseMethodPath(path string) (apiPath, method, rest string, ok bool) {
	const prefix = "paths."
	if !strings.HasPrefix(path, prefix) {
		return "", "", "", false
	}

	body := path[len(prefix):]
	methods := []string{"get", "put", "post", "delete", "options", "head", "patch", "trace"}
	bestIdx := -1
	bestMethod := ""
	bestEnd := -1

	for _, m := range methods {
		pattern := "." + m
		searchPos := 0
		for {
			idx := strings.Index(body[searchPos:], pattern)
			if idx < 0 {
				break
			}
			idx += searchPos
			end := idx + len(pattern)
			if end == len(body) || body[end] == '.' {
				if idx > bestIdx {
					bestIdx = idx
					bestMethod = strings.ToUpper(m)
					bestEnd = end
				}
			}
			searchPos = idx + 1
		}
	}

	if bestIdx <= 0 || bestMethod == "" {
		return "", "", "", false
	}

	return body[:bestIdx], bestMethod, body[bestEnd:], true
}

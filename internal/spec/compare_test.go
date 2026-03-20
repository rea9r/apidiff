package spec

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/rea9r/apidiff/internal/diff"
)

func TestComparePathsMethods(t *testing.T) {
	oldSpec := specWithPaths(map[string][]string{
		"/users":  {"get", "post"},
		"/orders": {"get"},
	})
	newSpec := specWithPaths(map[string][]string{
		"/users":    {"get", "delete"},
		"/products": {"post"},
	})

	got := ComparePathsMethods(oldSpec, newSpec)
	want := []diff.Diff{
		{Type: diff.Removed, Path: "paths./orders.get", OldValue: "operation", NewValue: nil},
		{Type: diff.Added, Path: "paths./products.post", OldValue: nil, NewValue: "operation"},
		{Type: diff.Added, Path: "paths./users.delete", OldValue: nil, NewValue: "operation"},
		{Type: diff.Removed, Path: "paths./users.post", OldValue: "operation", NewValue: nil},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("ComparePathsMethods mismatch (-want +got):\n%s", d)
	}
}

func specWithPaths(pathMethods map[string][]string) map[string]any {
	paths := map[string]any{}
	for path, methods := range pathMethods {
		pathItem := map[string]any{}
		for _, method := range methods {
			pathItem[method] = map[string]any{}
		}
		paths[path] = pathItem
	}

	return map[string]any{
		"openapi": "3.0.0",
		"paths":   paths,
	}
}

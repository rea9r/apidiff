package openapi

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/rea9r/xdiff/internal/delta"
)

func TestLabelDiffPaths(t *testing.T) {
	in := []delta.Diff{
		{Type: delta.Added, Path: "paths./users.post", NewValue: "operation"},
		{Type: delta.Removed, Path: "paths./users.post.requestBody.required", OldValue: "optional"},
		{Type: delta.TypeChanged, Path: "paths./users.get.responses.200.content.application/json.schema.type", OldValue: "object", NewValue: "array"},
	}

	got := LabelDiffPaths(in)
	want := []delta.Diff{
		{Type: delta.Added, Path: "POST /users", NewValue: "operation"},
		{Type: delta.Removed, Path: "POST /users request body required", OldValue: "optional"},
		{Type: delta.TypeChanged, Path: "GET /users response 200 application/json schema type", OldValue: "object", NewValue: "array"},
	}

	if d := cmp.Diff(want, got); d != "" {
		t.Fatalf("LabelDiffPaths mismatch (-want +got):\n%s", d)
	}
}

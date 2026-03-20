package diff

import "testing"

func TestFilterIgnoredPaths(t *testing.T) {
	diffs := []Diff{
		{Type: Changed, Path: "user.name"},
		{Type: Changed, Path: "user.updated_at"},
		{Type: Added, Path: "meta.request_id"},
	}

	got := FilterIgnoredPaths(diffs, []string{"user.updated_at", "meta.request_id"})

	if len(got) != 1 {
		t.Fatalf("filtered diff count mismatch: got=%d want=1", len(got))
	}
	if got[0].Path != "user.name" {
		t.Fatalf("remaining diff path mismatch: got=%s want=user.name", got[0].Path)
	}
}

func TestFilterIgnoredPaths_NoIgnores(t *testing.T) {
	diffs := []Diff{
		{Type: Changed, Path: "user.name"},
	}

	got := FilterIgnoredPaths(diffs, nil)
	if len(got) != len(diffs) {
		t.Fatalf("expected same diff count: got=%d want=%d", len(got), len(diffs))
	}
}

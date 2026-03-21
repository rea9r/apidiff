package jsondiff

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/rea9r/xdiff/internal/delta"
)

func TestCompare(t *testing.T) {
	tests := []struct {
		name string
		old  string
		new  string
		want []delta.Diff
	}{
		{
			name: "added field",
			old:  `{"user":{"name":"Taro"}}`,
			new:  `{"user":{"name":"Taro","age":20}}`,
			want: []delta.Diff{
				{Type: delta.Added, Path: "user.age"},
			},
		},
		{
			name: "removed field",
			old:  `{"user":{"name":"Taro","email":"taro@example.com"}}`,
			new:  `{"user":{"name":"Taro"}}`,
			want: []delta.Diff{
				{Type: delta.Removed, Path: "user.email"},
			},
		},
		{
			name: "changed value",
			old:  `{"user":{"name":"Taro"}}`,
			new:  `{"user":{"name":"Hanako"}}`,
			want: []delta.Diff{
				{Type: delta.Changed, Path: "user.name"},
			},
		},
		{
			name: "type changed",
			old:  `{"user":{"age":"20"}}`,
			new:  `{"user":{"age":20}}`,
			want: []delta.Diff{
				{Type: delta.TypeChanged, Path: "user.age"},
			},
		},
		{
			name: "array element changed",
			old:  `{"items":["a","b"]}`,
			new:  `{"items":["a","c"]}`,
			want: []delta.Diff{
				{Type: delta.Changed, Path: "items[1]"},
			},
		},
		{
			name: "array element added",
			old:  `{"items":["a"]}`,
			new:  `{"items":["a","b"]}`,
			want: []delta.Diff{
				{Type: delta.Added, Path: "items[1]"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			oldValue := mustParseJSON(t, tt.old)
			newValue := mustParseJSON(t, tt.new)

			got := Compare(oldValue, newValue)
			if diff := cmp.Diff(tt.want, got, cmpopts.IgnoreFields(delta.Diff{}, "OldValue", "NewValue")); diff != "" {
				t.Fatalf("diff mismatch (-want +got):\n%s", diff)
			}
		})
	}
}

func TestCompareWithOptions_IgnoreOrder_ReorderedScalarArrayHasNoDiff(t *testing.T) {
	oldValue := mustParseJSON(t, `{"items":[1,2,3]}`)
	newValue := mustParseJSON(t, `{"items":[3,2,1]}`)

	got := CompareWithOptions(oldValue, newValue, Options{IgnoreOrder: true})
	if len(got) != 0 {
		t.Fatalf("expected no diffs for reordered scalar array, got: %+v", got)
	}
}

func TestCompareWithOptions_IgnoreOrder_ReorderedObjectArrayHasNoDiff(t *testing.T) {
	oldValue := mustParseJSON(t, `{"items":[{"id":1,"name":"a"},{"id":2,"name":"b"}]}`)
	newValue := mustParseJSON(t, `{"items":[{"id":2,"name":"b"},{"id":1,"name":"a"}]}`)

	got := CompareWithOptions(oldValue, newValue, Options{IgnoreOrder: true})
	if len(got) != 0 {
		t.Fatalf("expected no diffs for reordered object array, got: %+v", got)
	}
}

func TestCompareWithOptions_IgnoreOrder_ObjectFieldChangedStillDiffs(t *testing.T) {
	oldValue := mustParseJSON(t, `{"items":[{"id":1,"name":"a"},{"id":2,"name":"b"}]}`)
	newValue := mustParseJSON(t, `{"items":[{"id":2,"name":"B"},{"id":1,"name":"a"}]}`)

	got := CompareWithOptions(oldValue, newValue, Options{IgnoreOrder: true})
	if len(got) == 0 {
		t.Fatal("expected diffs when object field changes")
	}
}

func TestCompareWithOptions_IgnoreOrder_DuplicatesUseMultisetSemantics(t *testing.T) {
	oldValue := mustParseJSON(t, `{"items":[1,1,2]}`)
	newValue := mustParseJSON(t, `{"items":[1,2,2]}`)

	got := CompareWithOptions(oldValue, newValue, Options{IgnoreOrder: true})
	if len(got) == 0 {
		t.Fatal("expected diffs when multiplicity changes")
	}
}

func TestCompareWithOptions_DefaultOrderSensitive(t *testing.T) {
	oldValue := mustParseJSON(t, `{"items":[1,2,3]}`)
	newValue := mustParseJSON(t, `{"items":[3,2,1]}`)

	got := CompareWithOptions(oldValue, newValue, Options{})
	if len(got) == 0 {
		t.Fatal("expected diffs when ignore-order is disabled")
	}
}

func mustParseJSON(t *testing.T, s string) any {
	t.Helper()

	dec := json.NewDecoder(bytes.NewReader([]byte(s)))
	dec.UseNumber()

	var value any
	if err := dec.Decode(&value); err != nil {
		t.Fatalf("failed to parse json in test: %v", err)
	}

	return value
}

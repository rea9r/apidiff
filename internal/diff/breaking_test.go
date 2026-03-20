package diff

import "testing"

func TestIsBreaking(t *testing.T) {
	tests := []struct {
		name string
		typ  DiffType
		want bool
	}{
		{name: "added", typ: Added, want: false},
		{name: "removed", typ: Removed, want: true},
		{name: "changed", typ: Changed, want: false},
		{name: "type changed", typ: TypeChanged, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsBreaking(tt.typ)
			if got != tt.want {
				t.Fatalf("IsBreaking(%s) = %v, want %v", tt.typ, got, tt.want)
			}
		})
	}
}

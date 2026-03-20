package app

import "testing"

func TestParseArgs(t *testing.T) {
	tests := []struct {
		name    string
		args    []string
		want    config
		wantErr bool
	}{
		{
			name: "default format",
			args: []string{"old.json", "new.json"},
			want: config{
				format:  "text",
				oldPath: "old.json",
				newPath: "new.json",
			},
		},
		{
			name: "format flag short style",
			args: []string{"-format", "json", "old.json", "new.json"},
			want: config{
				format:  "json",
				oldPath: "old.json",
				newPath: "new.json",
			},
		},
		{
			name: "format flag long style",
			args: []string{"--format=json", "old.json", "new.json"},
			want: config{
				format:  "json",
				oldPath: "old.json",
				newPath: "new.json",
			},
		},
		{
			name:    "invalid format",
			args:    []string{"--format", "yaml", "old.json", "new.json"},
			wantErr: true,
		},
		{
			name:    "missing file args",
			args:    []string{"--format", "json", "old.json"},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseArgs(tt.args)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("parseArgs returned error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("config mismatch: got=%+v want=%+v", got, tt.want)
			}
		})
	}
}

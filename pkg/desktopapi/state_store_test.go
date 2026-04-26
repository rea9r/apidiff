package desktopapi

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func TestDesktopStateStoreLoadMissingFile(t *testing.T) {
	store := &desktopStateStore{
		path: filepath.Join(t.TempDir(), "missing", "desktop-state.json"),
	}

	state, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if state.Version != desktopStateVersion {
		t.Fatalf("version = %d, want %d", state.Version, desktopStateVersion)
	}
	if state.LastUsedMode != "json" {
		t.Fatalf("lastUsedMode = %q, want json", state.LastUsedMode)
	}
}

func TestDesktopStateStoreLoadMalformedJSONRecoverable(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "desktop-state.json")
	if err := os.WriteFile(path, []byte("{"), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	store := &desktopStateStore{path: path}
	state, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if state.Version != desktopStateVersion {
		t.Fatalf("version = %d, want %d", state.Version, desktopStateVersion)
	}
}

func TestDesktopStateStoreSaveLoadRoundtrip(t *testing.T) {
	store := &desktopStateStore{
		path: filepath.Join(t.TempDir(), "desktop-state.json"),
	}
	input := defaultDesktopState()
	input.LastUsedMode = "text"
	input.Directory.LeftRoot = "/tmp/left"
	input.Directory.RightRoot = "/tmp/right"
	input.Directory.ViewMode = "tree"
	input.JSONRecentPairs = []DesktopRecentPair{
		{OldPath: "/a.json", NewPath: "/b.json", UsedAt: "2026-01-01T00:00:00Z"},
	}

	if err := store.Save(input); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	loaded, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if loaded.LastUsedMode != "text" {
		t.Fatalf("lastUsedMode = %q, want text", loaded.LastUsedMode)
	}
	if loaded.Directory.LeftRoot != "/tmp/left" || loaded.Directory.RightRoot != "/tmp/right" {
		t.Fatalf("directory roots mismatch: %+v", loaded.Directory)
	}
	if loaded.Directory.ViewMode != "tree" {
		t.Fatalf("directory viewMode = %q, want tree", loaded.Directory.ViewMode)
	}
	if len(loaded.JSONRecentPairs) != 1 {
		t.Fatalf("jsonRecentPairs len = %d, want 1", len(loaded.JSONRecentPairs))
	}
}

func TestDesktopStateStoreLoadLegacyFolderKeys(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "desktop-state.json")
	legacyJSON := `{
		"version": 1,
		"lastUsedMode": "folder",
		"folder": {
			"leftRoot": "/legacy/left",
			"rightRoot": "/legacy/right",
			"currentPath": "api",
			"viewMode": "tree"
		},
		"folderRecentPairs": [
			{"leftRoot": "/r1/left", "rightRoot": "/r1/right", "currentPath": "", "viewMode": "list", "usedAt": "2026-01-01T00:00:00Z"}
		]
	}`
	if err := os.WriteFile(path, []byte(legacyJSON), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	store := &desktopStateStore{path: path}
	state, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if state.LastUsedMode != "directory" {
		t.Fatalf("lastUsedMode = %q, want directory", state.LastUsedMode)
	}
	if state.Directory.LeftRoot != "/legacy/left" || state.Directory.RightRoot != "/legacy/right" {
		t.Fatalf("legacy folder roots not migrated: %+v", state.Directory)
	}
	if state.Directory.CurrentPath != "api" || state.Directory.ViewMode != "tree" {
		t.Fatalf("legacy folder fields not migrated: %+v", state.Directory)
	}
	if len(state.DirectoryRecentPairs) != 1 || state.DirectoryRecentPairs[0].LeftRoot != "/r1/left" {
		t.Fatalf("legacy folderRecentPairs not migrated: %+v", state.DirectoryRecentPairs)
	}
	if state.Version != desktopStateVersion {
		t.Fatalf("version = %d, want %d", state.Version, desktopStateVersion)
	}
}

func TestNormalizeDesktopStateRecentDedupeAndMax10(t *testing.T) {
	input := defaultDesktopState()
	input.JSONRecentPairs = []DesktopRecentPair{
		{OldPath: " /a ", NewPath: " /b ", UsedAt: "1"},
		{OldPath: "/a", NewPath: "/b", UsedAt: "2"},
	}
	for i := 0; i < 20; i++ {
		input.TextRecentPairs = append(input.TextRecentPairs, DesktopRecentPair{
			OldPath: "/old/" + string(rune('a'+i)),
			NewPath: "/new/" + string(rune('a'+i)),
			UsedAt:  "2026-01-01T00:00:00Z",
		})
	}

	normalized := normalizeDesktopState(input)
	if len(normalized.JSONRecentPairs) != 1 {
		t.Fatalf("jsonRecentPairs len = %d, want 1", len(normalized.JSONRecentPairs))
	}
	if len(normalized.TextRecentPairs) != maxRecentEntries {
		t.Fatalf("textRecentPairs len = %d, want %d", len(normalized.TextRecentPairs), maxRecentEntries)
	}
}

func TestNormalizeDesktopStateEnumFallback(t *testing.T) {
	input := defaultDesktopState()
	input.LastUsedMode = "unknown"
	input.Text.DiffLayout = "grid"
	input.Directory.ViewMode = "matrix"
	input.JSON.Common.OutputFormat = "yaml"
	input.JSON.Common.TextStyle = "invalid"
	input.JSON.Common.IgnorePaths = []string{"", "  ", "a.b"}
	input.DirectoryRecentPairs = []DesktopRecentDirectoryPair{
		{LeftRoot: " /left ", RightRoot: " /right ", CurrentPath: " /api ", ViewMode: "x"},
	}

	normalized := normalizeDesktopState(input)

	if normalized.LastUsedMode != "json" {
		t.Fatalf("lastUsedMode = %q, want json", normalized.LastUsedMode)
	}
	if normalized.Text.DiffLayout != "split" {
		t.Fatalf("diffLayout = %q, want split", normalized.Text.DiffLayout)
	}
	if normalized.Directory.ViewMode != "list" {
		t.Fatalf("directory.viewMode = %q, want list", normalized.Directory.ViewMode)
	}
	if normalized.JSON.Common.OutputFormat != "text" {
		t.Fatalf("json.common.outputFormat = %q, want text", normalized.JSON.Common.OutputFormat)
	}
	if normalized.JSON.Common.TextStyle != "auto" {
		t.Fatalf("json.common.textStyle = %q, want auto", normalized.JSON.Common.TextStyle)
	}
	if len(normalized.JSON.Common.IgnorePaths) != 1 || normalized.JSON.Common.IgnorePaths[0] != "a.b" {
		t.Fatalf("json.common.ignorePaths = %+v, want [a.b]", normalized.JSON.Common.IgnorePaths)
	}
	if len(normalized.DirectoryRecentPairs) != 1 {
		t.Fatalf("directoryRecentPairs len = %d, want 1", len(normalized.DirectoryRecentPairs))
	}
	if normalized.DirectoryRecentPairs[0].ViewMode != "list" {
		t.Fatalf("directoryRecentPairs[0].viewMode = %q, want list", normalized.DirectoryRecentPairs[0].ViewMode)
	}
	if normalized.DirectoryRecentPairs[0].LeftRoot != "/left" ||
		normalized.DirectoryRecentPairs[0].RightRoot != "/right" ||
		normalized.DirectoryRecentPairs[0].CurrentPath != "/api" {
		t.Fatalf("directoryRecentPairs[0] trim mismatch: %+v", normalized.DirectoryRecentPairs[0])
	}
}

func TestServiceStateConcurrentAccess(t *testing.T) {
	dir := t.TempDir()
	store := &desktopStateStore{
		path: filepath.Join(dir, "desktop-state.json"),
	}
	svc := &Service{stateStore: store}

	// Seed initial state so Load reads real data.
	initial := defaultDesktopState()
	initial.LastUsedMode = "json"
	if err := svc.SaveDesktopState(initial); err != nil {
		t.Fatalf("initial Save() error = %v", err)
	}

	const goroutines = 20
	var wg sync.WaitGroup
	wg.Add(goroutines)

	for i := 0; i < goroutines; i++ {
		go func(n int) {
			defer wg.Done()
			if n%2 == 0 {
				// Writer
				state := defaultDesktopState()
				state.LastUsedMode = "text"
				state.Directory.LeftRoot = fmt.Sprintf("/tmp/left-%d", n)
				if err := svc.SaveDesktopState(state); err != nil {
					t.Errorf("goroutine %d: Save() error = %v", n, err)
				}
			} else {
				// Reader
				loaded, err := svc.LoadDesktopState()
				if err != nil {
					t.Errorf("goroutine %d: Load() error = %v", n, err)
				}
				if loaded == nil {
					t.Errorf("goroutine %d: Load() returned nil", n)
				}
			}
		}(i)
	}

	wg.Wait()
}

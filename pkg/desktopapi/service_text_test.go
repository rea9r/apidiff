package desktopapi

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadTextFileRejectsSymlink(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "target.txt")
	if err := os.WriteFile(target, []byte("hello"), 0o600); err != nil {
		t.Fatalf("write target: %v", err)
	}
	link := filepath.Join(dir, "link.txt")
	if err := os.Symlink(target, link); err != nil {
		t.Fatalf("symlink: %v", err)
	}

	svc := &Service{}
	resp, err := svc.LoadTextFile(LoadTextFileRequest{Path: link})
	if err == nil {
		t.Fatalf("expected error for symlink, got resp=%+v", resp)
	}
	if !strings.Contains(err.Error(), "symbolic link") {
		t.Fatalf("expected symlink error, got %v", err)
	}
}

func TestLoadTextFileRejectsDirectory(t *testing.T) {
	dir := t.TempDir()

	svc := &Service{}
	_, err := svc.LoadTextFile(LoadTextFileRequest{Path: dir})
	if err == nil {
		t.Fatalf("expected error for directory, got nil")
	}
	if !strings.Contains(err.Error(), "regular file") {
		t.Fatalf("expected regular-file error, got %v", err)
	}
}

func TestLoadTextFileRejectsLargeFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "big.bin")
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0o600) //nolint:gosec // G304: test fixture path
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := f.Truncate(maxTextFileSize + 1); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	if err := f.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	svc := &Service{}
	_, err = svc.LoadTextFile(LoadTextFileRequest{Path: path})
	if err == nil {
		t.Fatalf("expected error for oversized file, got nil")
	}
	if !strings.Contains(err.Error(), "too large") {
		t.Fatalf("expected too-large error, got %v", err)
	}
}

func TestLoadTextFileLoadsRegularFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "regular.txt")
	if err := os.WriteFile(path, []byte("hello"), 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}

	svc := &Service{}
	resp, err := svc.LoadTextFile(LoadTextFileRequest{Path: path})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Content != "hello" {
		t.Fatalf("unexpected content: %q", resp.Content)
	}
}

func TestSaveTextFileRejectsSymlink(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "target.txt")
	if err := os.WriteFile(target, []byte("old"), 0o600); err != nil {
		t.Fatalf("write target: %v", err)
	}
	link := filepath.Join(dir, "link.txt")
	if err := os.Symlink(target, link); err != nil {
		t.Fatalf("symlink: %v", err)
	}

	svc := &Service{}
	_, err := svc.SaveTextFile(SaveTextFileRequest{Path: link, Content: "new"})
	if err == nil {
		t.Fatalf("expected error for symlink, got nil")
	}
	if !strings.Contains(err.Error(), "symbolic link") {
		t.Fatalf("expected symlink error, got %v", err)
	}

	body, err := os.ReadFile(target) //nolint:gosec // G304: test fixture path
	if err != nil {
		t.Fatalf("read target: %v", err)
	}
	if string(body) != "old" {
		t.Fatalf("symlink target was modified: %q", string(body))
	}
}

func TestSaveTextFileAllowsCreatingNewFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "new.txt")

	svc := &Service{}
	_, err := svc.SaveTextFile(SaveTextFileRequest{Path: path, Content: "hello"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	body, err := os.ReadFile(path) //nolint:gosec // G304: test fixture path
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if string(body) != "hello" {
		t.Fatalf("unexpected content: %q", string(body))
	}
}

func TestSaveTextFileOverwritesRegularFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "regular.txt")
	if err := os.WriteFile(path, []byte("old"), 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}

	svc := &Service{}
	_, err := svc.SaveTextFile(SaveTextFileRequest{Path: path, Content: "new"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	body, err := os.ReadFile(path) //nolint:gosec // G304: test fixture path
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if string(body) != "new" {
		t.Fatalf("unexpected content: %q", string(body))
	}
}

package desktopapi

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeFile(t *testing.T, path, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatalf("write failed: %v", err)
	}
}

func findFolderEntry(t *testing.T, entries []FolderCompareEntry, relativePath string) FolderCompareEntry {
	t.Helper()
	for _, entry := range entries {
		if entry.RelativePath == relativePath {
			return entry
		}
	}
	t.Fatalf("entry %q not found", relativePath)
	return FolderCompareEntry{}
}

func TestCompareJSONFiles(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.json")
	newPath := filepath.Join(tmp, "new.json")

	writeFile(t, oldPath, `{"user":{"name":"Taro"}}`)
	writeFile(t, newPath, `{"user":{"name":"Hanako"}}`)

	svc := NewService()
	res, err := svc.CompareJSONFiles(CompareJSONRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "auto",
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONFiles returned error: %v", err)
	}
	if res == nil {
		t.Fatal("expected response")
	}
	if res.ExitCode != 1 {
		t.Fatalf("expected exitCode 1, got %d", res.ExitCode)
	}
	if !res.DiffFound {
		t.Fatal("expected diffFound=true")
	}
	if strings.TrimSpace(res.Output) == "" {
		t.Fatal("expected output")
	}
}

func TestCompareJSONRich_Basic(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.json")
	newPath := filepath.Join(tmp, "new.json")

	writeFile(t, oldPath, `{"name":"Taro","age":"20","email":"old@example.com"}`)
	writeFile(t, newPath, `{"name":"Hanako","age":20,"phone":"090-xxxx-xxxx"}`)

	svc := NewService()
	rawRes, err := svc.CompareJSONFiles(CompareJSONRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONFiles returned error: %v", err)
	}

	richRes, err := svc.CompareJSONRich(CompareJSONRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONRich returned error: %v", err)
	}
	if richRes == nil {
		t.Fatal("expected response")
	}
	if richRes.Result.ExitCode != rawRes.ExitCode ||
		richRes.Result.DiffFound != rawRes.DiffFound ||
		richRes.Result.Output != rawRes.Output ||
		richRes.Result.Error != rawRes.Error {
		t.Fatalf("raw compare result mismatch: got %+v, want %+v", richRes.Result, *rawRes)
	}
	if len(richRes.Diffs) == 0 {
		t.Fatal("expected rich diffs")
	}

	seenPath := map[string]bool{}
	seenType := map[string]bool{}
	for _, item := range richRes.Diffs {
		seenPath[item.Path] = true
		seenType[item.Type] = true
		if (item.Type == "removed" || item.Type == "type_changed") && !item.Breaking {
			t.Fatalf("expected breaking=true for type=%s", item.Type)
		}
	}

	if !seenPath["name"] || !seenPath["age"] || !seenPath["email"] || !seenPath["phone"] {
		t.Fatalf("expected canonical paths in rich diffs, got: %+v", richRes.Diffs)
	}
	if !seenType["changed"] || !seenType["type_changed"] || !seenType["removed"] || !seenType["added"] {
		t.Fatalf("expected all diff types in rich diffs, got: %+v", richRes.Diffs)
	}
	if richRes.Summary.Breaking < 2 {
		t.Fatalf("expected at least 2 breaking diffs, got summary: %+v", richRes.Summary)
	}
}

func TestCompareJSONRich_OnlyBreaking(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.json")
	newPath := filepath.Join(tmp, "new.json")

	writeFile(t, oldPath, `{"name":"Taro","age":"20","email":"old@example.com"}`)
	writeFile(t, newPath, `{"name":"Hanako","age":20}`)

	svc := NewService()
	richRes, err := svc.CompareJSONRich(CompareJSONRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
			OnlyBreaking: true,
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONRich returned error: %v", err)
	}

	for _, item := range richRes.Diffs {
		if item.Type != "removed" && item.Type != "type_changed" {
			t.Fatalf("expected only breaking types, got %s", item.Type)
		}
		if !item.Breaking {
			t.Fatalf("expected breaking=true for %s", item.Type)
		}
	}
}

func TestCompareJSONRich_IgnorePaths(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.json")
	newPath := filepath.Join(tmp, "new.json")

	writeFile(t, oldPath, `{"name":"Taro","age":20,"email":"old@example.com"}`)
	writeFile(t, newPath, `{"name":"Hanako","age":20,"email":"new@example.com"}`)

	svc := NewService()
	richRes, err := svc.CompareJSONRich(CompareJSONRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
			IgnorePaths:  []string{"name"},
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONRich returned error: %v", err)
	}

	for _, item := range richRes.Diffs {
		if item.Path == "name" {
			t.Fatalf("expected ignorePaths to suppress name diff, got %+v", richRes.Diffs)
		}
	}
}

func TestCompareJSONRich_IgnoreOrder(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.json")
	newPath := filepath.Join(tmp, "new.json")

	writeFile(t, oldPath, `{"items":[1,2,3]}`)
	writeFile(t, newPath, `{"items":[3,2,1]}`)

	svc := NewService()
	richRes, err := svc.CompareJSONRich(CompareJSONRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
		IgnoreOrder: true,
	})
	if err != nil {
		t.Fatalf("CompareJSONRich returned error: %v", err)
	}

	if richRes.Result.DiffFound {
		t.Fatalf("expected no diff when ignoreOrder=true, got %+v", richRes.Result)
	}
	if len(richRes.Diffs) != 0 {
		t.Fatalf("expected no rich diffs, got %+v", richRes.Diffs)
	}
	if richRes.Summary != (JSONRichSummary{}) {
		t.Fatalf("expected empty summary, got %+v", richRes.Summary)
	}
}

func TestCompareJSONValuesRich_Basic(t *testing.T) {
	svc := NewService()

	res, err := svc.CompareJSONValuesRich(CompareJSONValuesRequest{
		OldValue: `{"name":"Taro","age":"20","email":"old@example.com"}`,
		NewValue: `{"name":"Hanako","age":20,"phone":"090-xxxx-xxxx"}`,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONValuesRich returned error: %v", err)
	}
	if res == nil {
		t.Fatal("expected response")
	}
	if !res.Result.DiffFound {
		t.Fatal("expected diffFound=true")
	}
	if strings.TrimSpace(res.Result.Output) == "" {
		t.Fatal("expected output")
	}
	if len(res.Diffs) == 0 {
		t.Fatal("expected structured diffs")
	}
	if res.Summary.Breaking == 0 {
		t.Fatalf("expected breaking diffs, got summary: %+v", res.Summary)
	}
}

func TestCompareJSONValuesRich_InvalidOldJSON(t *testing.T) {
	svc := NewService()

	_, err := svc.CompareJSONValuesRich(CompareJSONValuesRequest{
		OldValue: `{`,
		NewValue: `{"name":"Hanako"}`,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err == nil {
		t.Fatal("expected error for invalid old JSON")
	}
	if !strings.Contains(err.Error(), "invalid old JSON") {
		t.Fatalf("expected invalid old JSON error, got: %v", err)
	}
}

func TestCompareJSONValuesRich_InvalidNewJSON(t *testing.T) {
	svc := NewService()

	_, err := svc.CompareJSONValuesRich(CompareJSONValuesRequest{
		OldValue: `{"name":"Taro"}`,
		NewValue: `{`,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err == nil {
		t.Fatal("expected error for invalid new JSON")
	}
	if !strings.Contains(err.Error(), "invalid new JSON") {
		t.Fatalf("expected invalid new JSON error, got: %v", err)
	}
}

func TestCompareJSONValuesRich_IgnoreOrder(t *testing.T) {
	svc := NewService()

	res, err := svc.CompareJSONValuesRich(CompareJSONValuesRequest{
		OldValue: `{"items":[1,2,3]}`,
		NewValue: `{"items":[3,2,1]}`,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
		IgnoreOrder: true,
	})
	if err != nil {
		t.Fatalf("CompareJSONValuesRich returned error: %v", err)
	}
	if res.Result.DiffFound {
		t.Fatalf("expected no diff when ignoreOrder=true, got %+v", res.Result)
	}
	if len(res.Diffs) != 0 {
		t.Fatalf("expected no diffs, got %+v", res.Diffs)
	}
}

func TestCompareJSONValuesRich_IgnorePaths(t *testing.T) {
	svc := NewService()

	res, err := svc.CompareJSONValuesRich(CompareJSONValuesRequest{
		OldValue: `{"name":"Taro","age":20}`,
		NewValue: `{"name":"Hanako","age":20}`,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
			IgnorePaths:  []string{"name"},
		},
	})
	if err != nil {
		t.Fatalf("CompareJSONValuesRich returned error: %v", err)
	}
	if res.Result.DiffFound {
		t.Fatalf("expected no diff when ignorePaths suppresses all, got %+v", res.Result)
	}
	if len(res.Diffs) != 0 {
		t.Fatalf("expected no diffs, got %+v", res.Diffs)
	}
}

func TestCompareSpecRich_PathMethodAddedRemoved(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.yaml")
	newPath := filepath.Join(tmp, "new.yaml")

	writeFile(t, oldPath, `paths:
  /users:
    get: {}
`)
	writeFile(t, newPath, `paths:
  /users:
    post: {}
`)

	svc := NewService()
	rawRes, err := svc.CompareSpecFiles(CompareSpecRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecFiles returned error: %v", err)
	}

	richRes, err := svc.CompareSpecRich(CompareSpecRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecRich returned error: %v", err)
	}
	if richRes.Result.ExitCode != rawRes.ExitCode || richRes.Result.DiffFound != rawRes.DiffFound {
		t.Fatalf("raw compare result mismatch: got %+v want %+v", richRes.Result, *rawRes)
	}
	if len(richRes.Diffs) == 0 {
		t.Fatal("expected rich diffs")
	}

	seenRemoved := false
	seenAdded := false
	for _, diff := range richRes.Diffs {
		if diff.Path == "paths./users.get" {
			seenRemoved = true
			if diff.GroupKey != "GET /users" || diff.GroupKind != "operation" {
				t.Fatalf("unexpected group for removed op: %+v", diff)
			}
			if !diff.Breaking {
				t.Fatalf("removed operation should be breaking: %+v", diff)
			}
		}
		if diff.Path == "paths./users.post" {
			seenAdded = true
			if diff.GroupKey != "POST /users" || diff.GroupKind != "operation" {
				t.Fatalf("unexpected group for added op: %+v", diff)
			}
		}
		if strings.TrimSpace(diff.Label) == "" {
			t.Fatalf("expected non-empty label: %+v", diff)
		}
	}
	if !seenRemoved || !seenAdded {
		t.Fatalf("expected added+removed operation diffs, got %+v", richRes.Diffs)
	}
}

func TestCompareSpecRich_RequestBodyRequired(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.yaml")
	newPath := filepath.Join(tmp, "new.yaml")

	writeFile(t, oldPath, `paths:
  /users:
    post:
      requestBody:
        required: false
`)
	writeFile(t, newPath, `paths:
  /users:
    post:
      requestBody:
        required: true
`)

	svc := NewService()
	richRes, err := svc.CompareSpecRich(CompareSpecRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecRich returned error: %v", err)
	}
	if len(richRes.Diffs) != 1 {
		t.Fatalf("expected one diff, got %+v", richRes.Diffs)
	}
	diff := richRes.Diffs[0]
	if diff.Path != "paths./users.post.requestBody.required" {
		t.Fatalf("unexpected path: %+v", diff)
	}
	if diff.GroupKey != "POST /users" || diff.GroupKind != "operation" {
		t.Fatalf("unexpected group: %+v", diff)
	}
	if !diff.Breaking {
		t.Fatalf("requestBody.required regression should be breaking: %+v", diff)
	}
	if !strings.Contains(strings.ToLower(diff.Label), "request body required") {
		t.Fatalf("unexpected label: %s", diff.Label)
	}
}

func TestCompareSpecRich_ResponseSchemaType(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.yaml")
	newPath := filepath.Join(tmp, "new.yaml")

	writeFile(t, oldPath, `paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: string
`)
	writeFile(t, newPath, `paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: integer
`)

	svc := NewService()
	richRes, err := svc.CompareSpecRich(CompareSpecRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecRich returned error: %v", err)
	}
	if len(richRes.Diffs) != 1 {
		t.Fatalf("expected one diff, got %+v", richRes.Diffs)
	}
	diff := richRes.Diffs[0]
	if diff.Type != "type_changed" {
		t.Fatalf("expected type_changed, got %+v", diff)
	}
	if !diff.Breaking {
		t.Fatalf("expected type_changed to be breaking, got %+v", diff)
	}
	if diff.GroupKey != "GET /users" || diff.GroupKind != "operation" {
		t.Fatalf("unexpected group: %+v", diff)
	}
	if !strings.Contains(strings.ToLower(diff.Label), "response schema type changed") {
		t.Fatalf("unexpected label: %s", diff.Label)
	}
}

func TestCompareSpecRich_OnlyBreaking(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.yaml")
	newPath := filepath.Join(tmp, "new.yaml")

	writeFile(t, oldPath, `paths:
  /users:
    get: {}
`)
	writeFile(t, newPath, `paths:
  /users:
    get: {}
  /health:
    get: {}
`)

	svc := NewService()
	richRes, err := svc.CompareSpecRich(CompareSpecRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
			OnlyBreaking: true,
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecRich returned error: %v", err)
	}
	if richRes.Result.DiffFound {
		t.Fatalf("expected no breaking diff for operation add, got %+v", richRes.Result)
	}
	if len(richRes.Diffs) != 0 {
		t.Fatalf("expected no rich diffs, got %+v", richRes.Diffs)
	}
}

func TestCompareSpecRich_IgnorePaths(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "old.yaml")
	newPath := filepath.Join(tmp, "new.yaml")

	writeFile(t, oldPath, `paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: string
`)
	writeFile(t, newPath, `paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: integer
`)

	ignorePath := "paths./users.get.responses.200.content.application/json.schema.type"
	svc := NewService()
	richRes, err := svc.CompareSpecRich(CompareSpecRequest{
		OldPath: oldPath,
		NewPath: newPath,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
			IgnorePaths:  []string{ignorePath},
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecRich returned error: %v", err)
	}
	if richRes.Result.DiffFound {
		t.Fatalf("expected ignored path to suppress diff, got %+v", richRes.Result)
	}
	if len(richRes.Diffs) != 0 {
		t.Fatalf("expected no diffs, got %+v", richRes.Diffs)
	}
}

func TestCompareSpecValuesRich_Basic(t *testing.T) {
	svc := NewService()
	res, err := svc.CompareSpecValuesRich(CompareSpecValuesRequest{
		OldValue: `paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: string
`,
		NewValue: `paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: integer
`,
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "semantic",
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecValuesRich returned error: %v", err)
	}
	if !res.Result.DiffFound {
		t.Fatalf("expected diffFound=true, got %+v", res.Result)
	}
	if len(res.Diffs) == 0 {
		t.Fatal("expected rich diffs")
	}
}

func TestCompareSpecFiles_MissingFile(t *testing.T) {
	svc := NewService()
	res, err := svc.CompareSpecFiles(CompareSpecRequest{
		OldPath: "missing-old.yaml",
		NewPath: "missing-new.yaml",
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "auto",
		},
	})
	if err != nil {
		t.Fatalf("CompareSpecFiles returned unexpected error: %v", err)
	}
	if res == nil {
		t.Fatal("expected response")
	}
	if res.ExitCode != 2 {
		t.Fatalf("expected exitCode 2, got %d", res.ExitCode)
	}
	if res.Error == "" {
		t.Fatal("expected error message")
	}
}

func TestCompareText(t *testing.T) {
	svc := NewService()
	res, err := svc.CompareText(CompareTextRequest{
		OldText: "hello\nworld\n",
		NewText: "hello\nxdiff\n",
		Common: CompareCommon{
			FailOn:       "any",
			OutputFormat: "text",
			TextStyle:    "auto",
		},
	})
	if err != nil {
		t.Fatalf("CompareText returned error: %v", err)
	}
	if res == nil {
		t.Fatal("expected response")
	}
	if res.ExitCode != 1 {
		t.Fatalf("expected exitCode 1, got %d", res.ExitCode)
	}
	if !res.DiffFound {
		t.Fatal("expected diffFound=true")
	}
	if strings.TrimSpace(res.Output) == "" {
		t.Fatal("expected output")
	}
}

func TestListScenarioChecks(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "snapshots", "old.json")
	newPath := filepath.Join(tmp, "snapshots", "new.json")
	scenarioPath := filepath.Join(tmp, "xdiff.yaml")

	writeFile(t, oldPath, `{"user":{"name":"Taro"}}`)
	writeFile(t, newPath, `{"user":{"name":"Hanako"}}`)
	writeFile(t, scenarioPath, `
version: 1
checks:
  - name: local-user-json
    kind: json
    old: snapshots/old.json
    new: snapshots/new.json
`)

	svc := NewService()
	res, err := svc.ListScenarioChecks(ListScenarioChecksRequest{
		ScenarioPath: scenarioPath,
		ReportFormat: "text",
	})
	if err != nil {
		t.Fatalf("ListScenarioChecks returned error: %v", err)
	}
	if res == nil {
		t.Fatal("expected response")
	}
	if res.ExitCode != 0 {
		t.Fatalf("expected exitCode 0, got %d", res.ExitCode)
	}
	if len(res.Checks) != 1 {
		t.Fatalf("expected 1 check, got %d", len(res.Checks))
	}
	if res.Checks[0].Name != "local-user-json" {
		t.Fatalf("unexpected check name: %s", res.Checks[0].Name)
	}
}

func TestRunScenario(t *testing.T) {
	tmp := t.TempDir()
	oldPath := filepath.Join(tmp, "snapshots", "old.json")
	newPath := filepath.Join(tmp, "snapshots", "new.json")
	scenarioPath := filepath.Join(tmp, "xdiff.yaml")

	writeFile(t, oldPath, `{"user":{"name":"Taro"}}`)
	writeFile(t, newPath, `{"user":{"name":"Hanako"}}`)
	writeFile(t, scenarioPath, `
version: 1
checks:
  - name: local-user-json
    kind: json
    old: snapshots/old.json
    new: snapshots/new.json
`)

	svc := NewService()
	res, err := svc.RunScenario(RunScenarioRequest{
		ScenarioPath: scenarioPath,
		ReportFormat: "text",
	})
	if err != nil {
		t.Fatalf("RunScenario returned error: %v", err)
	}
	if res == nil {
		t.Fatal("expected response")
	}
	if res.Summary == nil {
		t.Fatal("expected summary")
	}
	if len(res.Results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(res.Results))
	}
}

func TestLoadTextFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "sample.txt")
	want := "hello\nworld\n"

	if err := os.WriteFile(path, []byte(want), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	svc := NewService()
	got, err := svc.LoadTextFile(LoadTextFileRequest{Path: path})
	if err != nil {
		t.Fatalf("LoadTextFile() error = %v", err)
	}

	if got.Path != path {
		t.Fatalf("LoadTextFile() path = %q, want %q", got.Path, path)
	}

	if got.Content != want {
		t.Fatalf("LoadTextFile() content = %q, want %q", got.Content, want)
	}
}

func TestLoadTextFileRejectsNonUTF8(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "binary.bin")

	if err := os.WriteFile(path, []byte{0xff, 0xfe, 0xfd}, 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	svc := NewService()
	_, err := svc.LoadTextFile(LoadTextFileRequest{Path: path})
	if err == nil {
		t.Fatal("LoadTextFile() error = nil, want non-nil")
	}
}

func TestCompareFolders_ScannedAndVisibleSummary(t *testing.T) {
	leftRoot := filepath.Join(t.TempDir(), "left")
	rightRoot := filepath.Join(t.TempDir(), "right")

	writeFile(t, filepath.Join(leftRoot, "same.txt"), "hello\n")
	writeFile(t, filepath.Join(rightRoot, "same.txt"), "hello\n")
	writeFile(t, filepath.Join(leftRoot, "changed.txt"), "foo\n")
	writeFile(t, filepath.Join(rightRoot, "changed.txt"), "bar\n")

	svc := NewService()
	res, err := svc.CompareFolders(CompareFoldersRequest{
		LeftRoot:  leftRoot,
		RightRoot: rightRoot,
		Recursive: true,
		ShowSame:  true,
	})
	if err != nil {
		t.Fatalf("CompareFolders() error = %v", err)
	}
	if res.Error != "" {
		t.Fatalf("CompareFolders() response error = %s", res.Error)
	}
	if res.ScannedSummary.Total != 2 || res.ScannedSummary.Same != 1 || res.ScannedSummary.Changed != 1 {
		t.Fatalf("unexpected scanned summary: %+v", res.ScannedSummary)
	}
	if res.VisibleSummary.Total != 2 || res.VisibleSummary.Same != 1 || res.VisibleSummary.Changed != 1 {
		t.Fatalf("unexpected visible summary: %+v", res.VisibleSummary)
	}
}

func TestCompareFolders_TypeMismatch(t *testing.T) {
	leftRoot := filepath.Join(t.TempDir(), "left")
	rightRoot := filepath.Join(t.TempDir(), "right")

	writeFile(t, filepath.Join(leftRoot, "node"), "file\n")
	if err := os.MkdirAll(filepath.Join(rightRoot, "node"), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}

	svc := NewService()
	res, err := svc.CompareFolders(CompareFoldersRequest{
		LeftRoot:  leftRoot,
		RightRoot: rightRoot,
		Recursive: true,
		ShowSame:  false,
	})
	if err != nil {
		t.Fatalf("CompareFolders() error = %v", err)
	}
	if res.Error != "" {
		t.Fatalf("CompareFolders() response error = %s", res.Error)
	}
	if res.ScannedSummary.Total != 1 || res.ScannedSummary.TypeMismatch != 1 {
		t.Fatalf("unexpected scanned summary: %+v", res.ScannedSummary)
	}
	if res.VisibleSummary.Total != 1 || res.VisibleSummary.TypeMismatch != 1 {
		t.Fatalf("unexpected visible summary: %+v", res.VisibleSummary)
	}
}

func TestCompareFolders_FilterAndShowSame(t *testing.T) {
	leftRoot := filepath.Join(t.TempDir(), "left")
	rightRoot := filepath.Join(t.TempDir(), "right")

	writeFile(t, filepath.Join(leftRoot, "same.txt"), "hello\n")
	writeFile(t, filepath.Join(rightRoot, "same.txt"), "hello\n")
	writeFile(t, filepath.Join(leftRoot, "changed.json"), `{"v":1}`)
	writeFile(t, filepath.Join(rightRoot, "changed.json"), `{"v":2}`)

	svc := NewService()
	res, err := svc.CompareFolders(CompareFoldersRequest{
		LeftRoot:   leftRoot,
		RightRoot:  rightRoot,
		Recursive:  true,
		ShowSame:   false,
		NameFilter: "CHANGED",
	})
	if err != nil {
		t.Fatalf("CompareFolders() error = %v", err)
	}
	if res.Error != "" {
		t.Fatalf("CompareFolders() response error = %s", res.Error)
	}
	if len(res.Entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(res.Entries))
	}
	if res.Entries[0].RelativePath != "changed.json" || res.Entries[0].Status != "changed" {
		t.Fatalf("unexpected entry: %+v", res.Entries[0])
	}
	if res.Entries[0].CompareModeHint != "json" {
		t.Fatalf("unexpected mode hint: %s", res.Entries[0].CompareModeHint)
	}
	if res.ScannedSummary.Total != 2 || res.ScannedSummary.Changed != 1 || res.ScannedSummary.Same != 1 {
		t.Fatalf("unexpected scanned summary: %+v", res.ScannedSummary)
	}
	if res.VisibleSummary.Total != 1 || res.VisibleSummary.Changed != 1 {
		t.Fatalf("unexpected visible summary: %+v", res.VisibleSummary)
	}
	if res.VisibleSummary.Same != 0 {
		t.Fatalf("expected same=0 in visible summary, got %+v", res.VisibleSummary)
	}
}

func TestCompareFolders_OpenableHints(t *testing.T) {
	leftRoot := filepath.Join(t.TempDir(), "left")
	rightRoot := filepath.Join(t.TempDir(), "right")

	writeFile(t, filepath.Join(leftRoot, "payload.json"), `{"v":1}`)
	writeFile(t, filepath.Join(rightRoot, "payload.json"), `{"v":2}`)
	writeFile(t, filepath.Join(leftRoot, "openapi.yaml"), "openapi: 3.0.0\ninfo:\n  title: old\n  version: 1.0.0\n")
	writeFile(t, filepath.Join(rightRoot, "openapi.yaml"), "openapi: 3.0.0\ninfo:\n  title: new\n  version: 1.0.0\n")
	writeFile(t, filepath.Join(leftRoot, "note.txt"), "left\n")
	writeFile(t, filepath.Join(rightRoot, "note.txt"), "right\n")
	writeFile(t, filepath.Join(leftRoot, "left-only.txt"), "left only\n")

	svc := NewService()
	res, err := svc.CompareFolders(CompareFoldersRequest{
		LeftRoot:  leftRoot,
		RightRoot: rightRoot,
		Recursive: true,
		ShowSame:  true,
	})
	if err != nil {
		t.Fatalf("CompareFolders() error = %v", err)
	}
	if res.Error != "" {
		t.Fatalf("CompareFolders() response error = %s", res.Error)
	}

	jsonEntry := findFolderEntry(t, res.Entries, "payload.json")
	if jsonEntry.CompareModeHint != "json" {
		t.Fatalf("payload.json hint = %s, want json", jsonEntry.CompareModeHint)
	}
	specEntry := findFolderEntry(t, res.Entries, "openapi.yaml")
	if specEntry.CompareModeHint != "spec" {
		t.Fatalf("openapi.yaml hint = %s, want spec", specEntry.CompareModeHint)
	}
	textEntry := findFolderEntry(t, res.Entries, "note.txt")
	if textEntry.CompareModeHint != "text" {
		t.Fatalf("note.txt hint = %s, want text", textEntry.CompareModeHint)
	}
	leftOnlyEntry := findFolderEntry(t, res.Entries, "left-only.txt")
	if leftOnlyEntry.CompareModeHint != "none" {
		t.Fatalf("left-only.txt hint = %s, want none", leftOnlyEntry.CompareModeHint)
	}
}

# apidiff

API response diff tool written in Go.

`apidiff` compares JSON responses and reports differences with clear exit codes.

## Quick Start

```bash
go run ./cmd/apidiff testdata/old.json testdata/new.json
```

Compare two URLs:

```bash
go run ./cmd/apidiff url https://old.example.com/api https://new.example.com/api
```

## Command Reference

Compare local JSON files:

```bash
apidiff [flags] old.json new.json
```

Compare JSON from URLs:

```bash
apidiff url [flags] <old-url> <new-url>
```

## Flags

Common flags (`apidiff` and `apidiff url`):

| Flag | Description | Default |
| --- | --- | --- |
| `--format text\|json` | Output format | `text` |
| `--fail-on none\|breaking\|any` | Exit code policy (`none`: always 0, `breaking`: fail only on breaking changes, `any`: fail on any diff) | `any` |
| `--ignore-path <path>` | Ignore exact diff path (repeatable) | none |
| `--only-breaking` | Show only breaking changes (`removed`, `type_changed`) | `false` |
| `--no-color` | Disable colored text output | `false` |

URL command only:

| Flag | Description | Default |
| --- | --- | --- |
| `--header "Key: Value"` | Add HTTP header (repeatable) | none |
| `--timeout <duration>` | Request timeout (`3s`, `1m`) | `5s` |

## Examples

Output JSON for CI:

```bash
go run ./cmd/apidiff --format json testdata/old.json testdata/new.json
```

Ignore noisy fields:

```bash
go run ./cmd/apidiff --ignore-path user.updated_at --ignore-path meta.request_id testdata/old.json testdata/new.json
```

Show only breaking changes:

```bash
go run ./cmd/apidiff --only-breaking testdata/old.json testdata/new.json
```

Fail only when breaking changes are detected:

```bash
go run ./cmd/apidiff --fail-on breaking testdata/old.json testdata/new.json
```

URL comparison with auth header and timeout:

```bash
go run ./cmd/apidiff url --timeout 3s --header "Authorization: Bearer xxx" https://old.example.com/api https://new.example.com/api
```

## Output Samples

Default output (GitHub-like patch):

```text
--- old
+++ new
@@ -1,12 +1,13 @@
 {
   "items": [
     "a",
-    "b"
+    "c",
+    "d"
   ],
   "user": {
-    "age": "20",
-    "email": "taro@example.com",
-    "name": "Taro"
+    "age": 20,
+    "name": "Hanako",
+    "phone": "090-xxxx-xxxx"
   }
 }
```

Machine-readable output (`--format json`):

```json
{
  "diffs": [
    {
      "type": "changed",
      "path": "items[1]",
      "old_value": "b",
      "new_value": "c"
    },
    {
      "type": "added",
      "path": "items[2]",
      "new_value": "d"
    },
    {
      "type": "removed",
      "path": "user.email",
      "old_value": "taro@example.com"
    },
    {
      "type": "type_changed",
      "path": "user.age",
      "old_value": "20",
      "new_value": 20,
      "old_type": "string",
      "new_type": "number"
    },
    {
      "type": "changed",
      "path": "user.name",
      "old_value": "Taro",
      "new_value": "Hanako"
    },
    {
      "type": "added",
      "path": "user.phone",
      "new_value": "090-xxxx-xxxx"
    }
  ],
  "summary": {
    "added": 2,
    "removed": 1,
    "changed": 2,
    "type_changed": 1
  }
}
```

## Exit Codes

- `0`: no differences
- `1`: differences found (based on `--fail-on` policy)
- `2`: execution error

## Development

```bash
go fmt ./...
go test ./...
go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.11.3 run --config=.golangci.yml
```

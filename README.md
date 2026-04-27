# xdiff

Interactive desktop GUI for diffing text, JSON, and directories. Built with Wails (Go) + React + Mantine.

## What it does

- **Text diff** — paste or load files, semantic and patch views, line search, encoding selection.
- **JSON diff** — semantic rich diff with grouped path/value table, raw fallback, ignore array order, ignore noisy paths.
- **Directory diff** — recursive scan with list and tree views, status filters, child-entry launch into Text or JSON diff.
- **AI Explain** — optional natural-language summary of the current diff via local Ollama.
- **Persistence** — last session restores paths, roots, and options. Recent targets per mode.
- **Theme & font** — light / dark / system; global code font scale (⌘+ / ⌘- / ⌘0).

Press `?` inside the app for the full keyboard shortcut list.

## Run it

See [`apps/desktop/README.md`](apps/desktop/README.md) for prerequisites and the dev / build commands.

Sample data for Directory diff lives under `examples/directory/basic` and `examples/directory/filters`.

## Development

From the repository root:

```bash
go fmt ./...
go test ./...
go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.11.3 run --config=.golangci.yml
```

CI runs the same `go test`, the desktop frontend tests/build, and `golangci-lint` on every push and PR.

# xdiff Desktop

Interactive desktop GUI for diffing text, JSON, and directories. Built with Wails (Go) + React + Mantine.

## Diff modes

- **Text diff** — paste or load files, semantic and patch views, line search with next/prev navigation, per-pane open / paste / copy / clear / save, encoding selection (UTF-8 / Shift-JIS / EUC-JP / UTF-16 LE/BE / ISO-8859-1).
- **JSON diff** — paste or load files, semantic rich diff with grouped path/value table, raw fallback, ignore array order, ignore noisy paths, type-change awareness.
- **Directory diff** — recursive scan with list and tree views, breadcrumb navigation, status quick filters (changed / left-only / right-only / type-mismatch / error / same), sortable columns, child-entry launch into Text or JSON diff.

## Beyond the diff

- **AI Explain** — optional natural-language summary of the current diff via local Ollama. First-run flow detects hardware tier, pulls a recommended model in-app, and supports in-app model removal so the "try then undo" loop stays inside xdiff.
- **Persistence** — last session restores paths, roots, and options. Recent JSON / text / directory targets are tracked per mode with per-mode clear actions. Editor text and diff output are not persisted.
- **Theme** — light / dark / system, with theme-aware viewer tokens.
- **Code font scale** — global size control for all code panes (⌘+ / ⌘- / ⌘0 or the header control).
- **Keyboard shortcuts** — press `?` inside the app to view the full list.

## Prerequisites

- Go (version pinned in `go.mod`)
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Node.js + npm

## Run in dev

From the repository root:

```bash
cd apps/desktop
npm --prefix frontend install
wails dev
```

Sample data for Directory diff lives under `examples/directory/basic` and `examples/directory/filters`.

## Frontend-only build

In a clean checkout, generate Wails bindings before building the frontend:

```bash
cd apps/desktop
wails generate module -tags wailsbindings
npm --prefix frontend run build
```

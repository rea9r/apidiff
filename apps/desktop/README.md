# xdiff Desktop (Wails, Phase 2)

This app is an experimental desktop GUI for xdiff.

## Scope (Phase 2)

- JSON file comparison
- OpenAPI spec comparison
- Scenario checks listing
- Scenario selected run (`only`)

Not included yet:

- Text compare GUI
- URL compare GUI
- File picker
- Packaging/distribution

## Prerequisites

- Go (same version as repository)
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- Node.js + npm

## Run (dev)

From this directory:

```bash
cd apps/desktop
npm --prefix frontend install
wails dev
```

## Build frontend only

```bash
cd apps/desktop
npm --prefix frontend run build
```

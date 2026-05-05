# xdiff

[![CI](https://github.com/rea9r/xdiff/actions/workflows/ci.yml/badge.svg)](https://github.com/rea9r/xdiff/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Interactive desktop GUI for diffs, with optional AI explanations.

![xdiff demo](docs/screenshots/demo.gif)

## What it does

- **Text diff** — paste or load files, semantic and patch views, line search, encoding selection.
- **JSON diff** — semantic rich diff with grouped path/value table, raw fallback, ignore array order, ignore noisy paths.
- **Directory diff** — recursive scan with list and tree views, status filters, child-entry launch into Text or JSON diff.
- **AI Explain** — optional natural-language summary of the current diff via local Ollama.
- **Persistence** — last session restores paths, roots, and options. Recent targets per mode.
- **Theme & font** — light / dark / system; global code font scale (⌘+ / ⌘- / ⌘0).
- **Shortcuts** — press `?` inside the app for the full keyboard list.

## Build from source

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

## Releases

Tagged commits matching `v*` trigger [`release.yml`](.github/workflows/release.yml), which builds the desktop app for macOS (arm64) and publishes a draft GitHub Release with the `.app` zip attached. Intel macOS / Windows / Linux can be added to the matrix later.

### Installing the macOS build

The app is ad-hoc signed (so it launches on Apple Silicon) but not signed with a Developer ID and not notarized. macOS will refuse to open it as "damaged" until you remove the quarantine attribute it adds to internet downloads:

```bash
unzip xdiff-vX.Y.Z-darwin-arm64.zip
mv xdiff-desktop.app /Applications/
xattr -cr /Applications/xdiff-desktop.app
open /Applications/xdiff-desktop.app
```

This `xattr -cr` is a one-time step. The app isn't notarized through the Apple Developer Program ($99/year), so macOS treats the download as untrusted by default — sorry for the extra step.

## License

[MIT](LICENSE) © rea9r

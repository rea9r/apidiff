package app

import (
	"flag"
	"fmt"
	"io"
	"strings"

	"github.com/rea9r/apidiff/internal/diff"
	"github.com/rea9r/apidiff/internal/input"
	"github.com/rea9r/apidiff/internal/output"
)

func Run(args []string) (int, error) {
	cfg, err := parseArgs(args)
	if err != nil {
		return 2, err
	}

	oldValue, err := input.LoadJSONFile(cfg.oldPath)
	if err != nil {
		return 2, err
	}

	newValue, err := input.LoadJSONFile(cfg.newPath)
	if err != nil {
		return 2, err
	}

	diffs := diff.Compare(oldValue, newValue)
	formatted, err := output.Format(diffs, cfg.format)
	if err != nil {
		return 2, err
	}
	fmt.Print(formatted)

	if len(diffs) > 0 {
		return 1, nil
	}
	return 0, nil
}

type config struct {
	format  string
	oldPath string
	newPath string
}

func parseArgs(args []string) (config, error) {
	flagArgs := normalizeLongFlags(args)

	fs := flag.NewFlagSet("apidiff", flag.ContinueOnError)
	fs.SetOutput(io.Discard)

	format := fs.String("format", "text", "output format: text or json")
	if err := fs.Parse(flagArgs); err != nil {
		return config{}, fmt.Errorf("failed to parse args: %w", err)
	}

	if *format != "text" && *format != "json" {
		return config{}, fmt.Errorf("invalid --format %q (allowed: text, json)", *format)
	}

	rest := fs.Args()
	if len(rest) != 2 {
		return config{}, fmt.Errorf("usage: apidiff [--format text|json] old.json new.json")
	}

	return config{
		format:  *format,
		oldPath: rest[0],
		newPath: rest[1],
	}, nil
}

func normalizeLongFlags(args []string) []string {
	normalized := make([]string, 0, len(args))
	for _, arg := range args {
		switch {
		case arg == "--format":
			normalized = append(normalized, "-format")
		case strings.HasPrefix(arg, "--format="):
			normalized = append(normalized, "-format="+strings.TrimPrefix(arg, "--format="))
		default:
			normalized = append(normalized, arg)
		}
	}
	return normalized
}

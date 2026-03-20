package main

import (
	"fmt"
	"strings"

	"github.com/rea9r/xdiff/internal/app"
	"github.com/spf13/cobra"
)

func runExample(common *commonFlagValues, exitCode *int) func(*cobra.Command, []string) error {
	return func(_ *cobra.Command, _ []string) error {
		out, _, err := buildExampleOutput(*common)
		if err != nil {
			return asRunError(2, err)
		}

		if writeErr := writeOutput(out); writeErr != nil {
			return asRunError(2, fmt.Errorf("failed to write stdout: %w", writeErr))
		}
		*exitCode = 0
		return nil
	}
}

func buildExampleOutput(common commonFlagValues) (string, int, error) {
	oldValue := map[string]any{
		"user": map[string]any{
			"name":  "Taro",
			"age":   "20",
			"email": "taro@example.com",
		},
	}
	newValue := map[string]any{
		"user": map[string]any{
			"name":  "Hanako",
			"age":   20,
			"phone": "090-xxxx-xxxx",
		},
	}

	code, rendered, err := app.RunWithValues(oldValue, newValue, app.CompareOptions{
		Format:       common.format,
		FailOn:       common.failOn,
		IgnorePaths:  append([]string(nil), common.ignorePaths...),
		OnlyBreaking: common.onlyBreaking,
		NoColor:      true,
	})
	if err != nil {
		return "", 0, err
	}

	var b strings.Builder
	b.WriteString("Quick example\n\n")
	b.WriteString("Run:\n")
	b.WriteString("  xdiff testdata/old.json testdata/new.json\n\n")
	b.WriteString("Expected output:\n")
	b.WriteString(rendered)
	if !strings.HasSuffix(rendered, "\n") {
		b.WriteString("\n")
	}
	fmt.Fprintf(&b, "\nSample command exit code (with current --fail-on): %d\n", code)
	b.WriteString("Tip:\n")
	b.WriteString("  xdiff --format json testdata/old.json testdata/new.json\n")
	return b.String(), code, nil
}

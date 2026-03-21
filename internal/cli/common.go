package cli

import (
	"io"

	"github.com/rea9r/xdiff/internal/output"
	"github.com/rea9r/xdiff/internal/runner"
	"github.com/spf13/pflag"
)

type commonFlagValues struct {
	outputFormat string
	failOn       string
	ignorePaths  []string
	onlyBreaking bool
	noColor      bool
	stdout       io.Writer
}

func newCommonFlags(stdout io.Writer) *commonFlagValues {
	return &commonFlagValues{
		outputFormat: output.TextFormat,
		failOn:       "any",
		stdout:       stdout,
	}
}

func (c *commonFlagValues) useColor() bool {
	return output.ShouldUseColorOnWriter(c.noColor, c.stdout)
}

func (c *commonFlagValues) compareOptions() runner.CompareOptions {
	return runner.CompareOptions{
		Format:       c.outputFormat,
		FailOn:       c.failOn,
		IgnorePaths:  append([]string(nil), c.ignorePaths...),
		OnlyBreaking: c.onlyBreaking,
		UseColor:     c.useColor(),
	}
}

func (c *commonFlagValues) fileOptions(oldPath, newPath string) runner.Options {
	return runner.Options{
		Format:       c.outputFormat,
		FailOn:       c.failOn,
		IgnorePaths:  append([]string(nil), c.ignorePaths...),
		OnlyBreaking: c.onlyBreaking,
		UseColor:     c.useColor(),
		OldPath:      oldPath,
		NewPath:      newPath,
	}
}

func bindCommonFlags(flags *pflag.FlagSet, common *commonFlagValues) {
	flags.StringVar(&common.outputFormat, "output-format", output.TextFormat, "output format: text or json")
	flags.StringVar(&common.failOn, "fail-on", "any", "failure mode: none, breaking, or any")
	flags.StringArrayVar(&common.ignorePaths, "ignore-path", nil, "ignore diff by exact path (can be specified multiple times)")
	flags.BoolVar(&common.onlyBreaking, "only-breaking", false, "show only breaking changes")
	flags.BoolVar(&common.noColor, "no-color", false, "disable colored text output")
}

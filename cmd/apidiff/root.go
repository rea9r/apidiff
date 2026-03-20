package main

import (
	"errors"
	"fmt"

	"github.com/rea9r/apidiff/internal/app"
	"github.com/rea9r/apidiff/internal/output"
	"github.com/spf13/cobra"
)

func runCLI(args []string) (int, error) {
	opts := app.Options{
		Format: output.TextFormat,
	}
	exitCode := 0

	cmd := &cobra.Command{
		Use:           "apidiff [flags] old.json new.json",
		Short:         "Compare two JSON files and show differences",
		SilenceUsage:  true,
		SilenceErrors: true,
		Args:          cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, positionalArgs []string) error {
			opts.OldPath = positionalArgs[0]
			opts.NewPath = positionalArgs[1]

			code, out, err := app.RunWithOptions(opts)
			if out != "" {
				if writeErr := writeStdout(out); writeErr != nil {
					return &runError{
						code: 2,
						err:  fmt.Errorf("failed to write stdout: %w", writeErr),
					}
				}
			}
			if err != nil {
				return &runError{
					code: code,
					err:  err,
				}
			}

			exitCode = code
			return nil
		},
	}

	flags := cmd.Flags()
	flags.StringVar(&opts.Format, "format", output.TextFormat, "output format: text or json")
	flags.StringArrayVar(&opts.IgnorePaths, "ignore-path", nil, "ignore diff by exact path (can be specified multiple times)")
	flags.BoolVar(&opts.OnlyBreaking, "only-breaking", false, "show only breaking changes")

	cmd.SetArgs(args)
	if err := cmd.Execute(); err != nil {
		var rerr *runError
		if errors.As(err, &rerr) {
			return rerr.code, rerr.err
		}
		return 2, err
	}

	return exitCode, nil
}

type runError struct {
	code int
	err  error
}

func (e *runError) Error() string {
	return e.err.Error()
}

func (e *runError) Unwrap() error {
	return e.err
}

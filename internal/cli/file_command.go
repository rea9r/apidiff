package cli

import (
	"github.com/rea9r/xdiff/internal/runner"
	"github.com/spf13/cobra"
)

func runFileCompare(common *commonFlagValues, jsonFlags *jsonCompareFlagValues, exitCode *int) func(*cobra.Command, []string) error {
	return func(_ *cobra.Command, positionalArgs []string) error {
		opts := common.fileOptions(positionalArgs[0], positionalArgs[1])
		opts.IgnoreOrder = jsonFlags.ignoreOrder

		code, out, err := runner.RunJSONFiles(opts)
		if err := writeRunnerResult(common.stdout, code, out, err); err != nil {
			return err
		}

		*exitCode = code
		return nil
	}
}

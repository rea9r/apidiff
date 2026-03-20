package main

import "github.com/spf13/cobra"

func newRootCommand(exitCode *int) *cobra.Command {
	commonFlags := newCommonFlags()
	showExample := false

	root := &cobra.Command{
		Use:           "xdiff [flags] old.json new.json",
		Short:         "Compare API responses (JSON files/URLs) and OpenAPI specs",
		SilenceUsage:  true,
		SilenceErrors: true,
		Args: func(cmd *cobra.Command, args []string) error {
			if showExample {
				return cobra.NoArgs(cmd, args)
			}
			return cobra.ExactArgs(2)(cmd, args)
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			if showExample {
				return runExample(commonFlags, exitCode)(cmd, args)
			}
			return runFileCompare(commonFlags, exitCode)(cmd, args)
		},
	}

	bindCommonFlags(root.Flags(), commonFlags)
	root.Flags().BoolVar(&showExample, "example", false, "show a runnable quick example and expected output")
	root.AddCommand(newURLCommand(commonFlags, exitCode))
	root.AddCommand(newSpecCommand(commonFlags, exitCode))
	return root
}

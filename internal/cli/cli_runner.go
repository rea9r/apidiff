package cli

import (
	"errors"
	"fmt"
	"io"
	"os"
)

func Execute(args []string, stdout, stderr io.Writer) int {
	if stdout == nil {
		stdout = os.Stdout
	}
	if stderr == nil {
		stderr = os.Stderr
	}

	code, err := runCLI(args, stdout)
	if err != nil {
		if _, writeErr := io.WriteString(stderr, err.Error()+"\n"); writeErr != nil {
			return 2
		}
	}
	return code
}

func runCLI(args []string, stdout io.Writer) (int, error) {
	exitCode := 0

	root := newRootCommand(&exitCode, stdout)
	root.SetArgs(args)
	if err := root.Execute(); err != nil {
		var runErr *runError
		if errors.As(err, &runErr) {
			return runErr.code, runErr.err
		}
		return 2, err
	}

	return exitCode, nil
}

type runError struct {
	code int
	err  error
}

func asRunError(code int, err error) *runError {
	return &runError{
		code: code,
		err:  err,
	}
}

func (e *runError) Error() string {
	return e.err.Error()
}

func (e *runError) Unwrap() error {
	return e.err
}

func writeOutput(w io.Writer, out string) error {
	if out == "" {
		return nil
	}
	_, err := io.WriteString(w, out)
	return err
}

func writeRunnerResult(w io.Writer, code int, out string, err error) error {
	if writeErr := writeOutput(w, out); writeErr != nil {
		return asRunError(2, fmt.Errorf("failed to write stdout: %w", writeErr))
	}
	if err != nil {
		return asRunError(code, err)
	}
	return nil
}

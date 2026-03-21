package cli

func writeOutput(out string) error {
	if out == "" {
		return nil
	}
	return writeStdout(out)
}

package main

import (
	"os"

	"github.com/rea9r/xdiff/internal/cli"
)

func main() {
	code, err := cli.Execute(os.Args[1:])
	if err != nil {
		if _, writeErr := os.Stderr.WriteString(err.Error() + "\n"); writeErr != nil {
			os.Exit(2)
		}
	}
	os.Exit(code)
}

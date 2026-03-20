package main

import (
	"fmt"
	"os"

	"github.com/rea9r/apidiff/internal/app"
)

func main() {
	code, err := app.Run(os.Args[1:])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
	os.Exit(code)
}

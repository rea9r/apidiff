package source

import (
	"bytes"
	"fmt"
	"os"
)

func LoadJSONFile(path string) (any, error) {
	data, err := os.ReadFile(path) //nolint:gosec // G304: path is user-provided CLI input
	if err != nil {
		return nil, fmt.Errorf("failed to read file %q: %w", path, err)
	}

	return decodeJSON(bytes.NewReader(data), path)
}

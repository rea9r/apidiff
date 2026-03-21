package source

import (
	"bytes"
	"fmt"
	"os"
)

func LoadJSONFile(path string) (any, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %q: %w", path, err)
	}

	return decodeJSON(bytes.NewReader(data), path)
}

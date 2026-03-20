package input

import (
	"encoding/json"
	"fmt"
	"io"
)

func decodeJSON(r io.Reader, source string) (any, error) {
	dec := json.NewDecoder(r)
	dec.UseNumber()

	var value any
	if err := dec.Decode(&value); err != nil {
		return nil, fmt.Errorf("failed to parse JSON in %q: %w", source, err)
	}

	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		if err == nil {
			return nil, fmt.Errorf("invalid JSON in %q: multiple top-level values", source)
		}
		return nil, fmt.Errorf("failed to validate JSON in %q: %w", source, err)
	}

	return value, nil
}

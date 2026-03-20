package output

import (
	"encoding/json"

	"github.com/rea9r/apidiff/internal/diff"
)

type jsonDiff struct {
	Type     diff.DiffType `json:"type"`
	Path     string        `json:"path"`
	OldValue any           `json:"old_value,omitempty"`
	NewValue any           `json:"new_value,omitempty"`
	OldType  string        `json:"old_type,omitempty"`
	NewType  string        `json:"new_type,omitempty"`
}

type jsonSummary struct {
	Added       int `json:"added"`
	Removed     int `json:"removed"`
	Changed     int `json:"changed"`
	TypeChanged int `json:"type_changed"`
}

type jsonResult struct {
	Diffs   []jsonDiff  `json:"diffs"`
	Summary jsonSummary `json:"summary"`
}

func FormatJSON(diffs []diff.Diff) (string, error) {
	result := jsonResult{
		Diffs:   make([]jsonDiff, 0, len(diffs)),
		Summary: jsonSummary{},
	}

	for _, d := range diffs {
		jd := jsonDiff{
			Type:     d.Type,
			Path:     d.Path,
			OldValue: d.OldValue,
			NewValue: d.NewValue,
		}
		if d.Type == diff.TypeChanged {
			jd.OldType = diff.ValueType(d.OldValue)
			jd.NewType = diff.ValueType(d.NewValue)
		}
		result.Diffs = append(result.Diffs, jd)

		switch d.Type {
		case diff.Added:
			result.Summary.Added++
		case diff.Removed:
			result.Summary.Removed++
		case diff.Changed:
			result.Summary.Changed++
		case diff.TypeChanged:
			result.Summary.TypeChanged++
		}
	}

	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data) + "\n", nil
}

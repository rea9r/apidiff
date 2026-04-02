package desktopapi

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/rea9r/xdiff/internal/openapi"
	"github.com/rea9r/xdiff/internal/output"
	"github.com/rea9r/xdiff/internal/runner"
	"github.com/rea9r/xdiff/internal/source"
	"sigs.k8s.io/yaml"
)

func (s *Service) CompareSpecFiles(req CompareSpecRequest) (*CompareResponse, error) {
	oldSpec, err := source.LoadOpenAPISpecFile(req.OldPath)
	if err != nil {
		return &CompareResponse{ExitCode: 2, Error: err.Error()}, nil
	}
	newSpec, err := source.LoadOpenAPISpecFile(req.NewPath)
	if err != nil {
		return &CompareResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	diffs := openapi.ComparePathsMethods(oldSpec, newSpec)
	opts := runner.CompareOptions{
		Format:        normalizeOutputFormat(req.Common.OutputFormat),
		FailOn:        req.Common.FailOn,
		IgnorePaths:   append([]string(nil), req.Common.IgnorePaths...),
		ShowPaths:     req.Common.ShowPaths,
		OnlyBreaking:  req.Common.OnlyBreaking,
		TextStyle:     req.Common.TextStyle,
		UseColor:      guiUseColor(),
		PathFormatter: openapi.HumanizePath,
	}

	res := runner.RunDeltaDiffsDetailed(diffs, opts)
	return &CompareResponse{
		ExitCode:  res.ExitCode,
		DiffFound: res.DiffFound,
		Output:    res.Output,
		Error:     errString(res.Err),
	}, nil
}

func (s *Service) CompareSpecRich(req CompareSpecRequest) (*CompareSpecRichResponse, error) {
	rawResult, err := s.CompareSpecFiles(req)
	if err != nil {
		return nil, err
	}

	diffReq := req
	diffReq.Common.OutputFormat = "text"
	diffReq.Common.TextStyle = "patch"
	diffReq.Common.NoColor = true
	diffResult, err := s.CompareSpecFiles(diffReq)
	if err != nil {
		return nil, err
	}

	structuredReq := req
	structuredReq.Common.OutputFormat = output.JSONFormat
	structuredReq.Common.ShowPaths = false
	structuredReq.Common.NoColor = true

	structuredResult, err := s.CompareSpecFiles(structuredReq)
	if err != nil {
		return nil, err
	}

	diffs, err := parseSpecMachineDiffs(structuredResult.Output)
	if err != nil {
		return nil, err
	}

	return &CompareSpecRichResponse{
		Result:   *rawResult,
		DiffText: pickDiffText(diffResult.Output, rawResult.Output),
		Summary:  summarizeSpecRichDiffs(diffs),
		Diffs:    diffs,
	}, nil
}

func (s *Service) CompareSpecValuesRich(req CompareSpecValuesRequest) (*CompareSpecRichResponse, error) {
	oldSpec, err := parseOpenAPISpecValue(req.OldValue, "old")
	if err != nil {
		return nil, err
	}
	newSpec, err := parseOpenAPISpecValue(req.NewValue, "new")
	if err != nil {
		return nil, err
	}

	diffs := openapi.ComparePathsMethods(oldSpec, newSpec)

	rawOptions := runner.CompareOptions{
		Format:        normalizeOutputFormat(req.Common.OutputFormat),
		FailOn:        req.Common.FailOn,
		IgnorePaths:   append([]string(nil), req.Common.IgnorePaths...),
		ShowPaths:     req.Common.ShowPaths,
		OnlyBreaking:  req.Common.OnlyBreaking,
		TextStyle:     req.Common.TextStyle,
		UseColor:      guiUseColor(),
		PathFormatter: openapi.HumanizePath,
	}
	rawRun := runner.RunDeltaDiffsDetailed(diffs, rawOptions)
	rawResult := CompareResponse{
		ExitCode:  rawRun.ExitCode,
		DiffFound: rawRun.DiffFound,
		Output:    rawRun.Output,
		Error:     errString(rawRun.Err),
	}

	structuredOptions := rawOptions
	structuredOptions.Format = output.JSONFormat
	structuredOptions.ShowPaths = false
	structuredOptions.UseColor = false
	structuredRun := runner.RunDeltaDiffsDetailed(diffs, structuredOptions)

	diffOptions := rawOptions
	diffOptions.Format = output.TextFormat
	diffOptions.TextStyle = "patch"
	diffOptions.ShowPaths = false
	diffOptions.UseColor = false
	diffRun := runner.RunDeltaDiffsDetailed(diffs, diffOptions)

	specDiffs, err := parseSpecMachineDiffs(structuredRun.Output)
	if err != nil {
		return nil, err
	}

	return &CompareSpecRichResponse{
		Result:   rawResult,
		DiffText: pickDiffText(diffRun.Output, rawResult.Output),
		Summary:  summarizeSpecRichDiffs(specDiffs),
		Diffs:    specDiffs,
	}, nil
}

func parseOpenAPISpecValue(raw, side string) (any, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, fmt.Errorf("%s spec is empty", side)
	}

	jsonData, err := yaml.YAMLToJSON([]byte(raw))
	if err != nil {
		return nil, fmt.Errorf("failed to parse %s spec: %w", side, err)
	}

	var parsed any
	if err := json.Unmarshal(jsonData, &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse %s spec: %w", side, err)
	}
	return parsed, nil
}

func parseSpecMachineDiffs(raw string) ([]SpecRichDiffItem, error) {
	if strings.TrimSpace(raw) == "" {
		return []SpecRichDiffItem{}, nil
	}

	var parsed jsonMachineResult
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse structured spec diff output: %w", err)
	}

	diffs := make([]SpecRichDiffItem, 0, len(parsed.Diffs))
	for _, item := range parsed.Diffs {
		groupKey, groupKind, label := deriveSpecGroupAndLabel(item.Path, item.Type)
		breaking := item.Type == "removed" || item.Type == "type_changed"
		diffs = append(diffs, SpecRichDiffItem{
			Type:      item.Type,
			Path:      item.Path,
			Label:     label,
			GroupKey:  groupKey,
			GroupKind: groupKind,
			Breaking:  breaking,
			OldValue:  item.OldValue,
			NewValue:  item.NewValue,
		})
	}

	return diffs, nil
}

var specSupportedMethods = []string{"get", "put", "post", "delete", "options", "head", "patch", "trace"}

func deriveSpecGroupAndLabel(path, diffType string) (groupKey, groupKind, label string) {
	if strings.HasPrefix(path, "paths.") {
		body := strings.TrimPrefix(path, "paths.")
		apiPath, method, rest, ok := splitSpecMethodPath(body)
		if ok {
			groupKey = strings.ToUpper(method) + " " + apiPath
			groupKind = "operation"
			switch {
			case rest == "":
				switch diffType {
				case "added":
					label = "Operation added"
				case "removed":
					label = "Operation removed"
				default:
					label = "Operation changed"
				}
			case rest == ".requestBody.required":
				label = "Request body required changed"
			case strings.HasPrefix(rest, ".responses."):
				tail := strings.TrimPrefix(rest, ".responses.")
				contentToken := ".content."
				contentIdx := strings.Index(tail, contentToken)
				if contentIdx > 0 {
					statusCode := tail[:contentIdx]
					contentAndSuffix := tail[contentIdx+len(contentToken):]
					suffix := ".schema.type"
					if strings.HasSuffix(contentAndSuffix, suffix) {
						contentType := strings.TrimSuffix(contentAndSuffix, suffix)
						label = fmt.Sprintf("Response schema type changed (%s %s)", statusCode, contentType)
					}
				}
				if label == "" {
					label = "Response changed"
				}
			default:
				label = openapi.HumanizePath(path)
			}

			if label == "" {
				label = openapi.HumanizePath(path)
			}
			return groupKey, groupKind, label
		}

		if idx := strings.Index(body, "."); idx > 0 {
			return body[:idx], "path", openapi.HumanizePath(path)
		}
		return body, "path", openapi.HumanizePath(path)
	}

	if strings.HasPrefix(path, "components.") {
		parts := strings.Split(path, ".")
		if len(parts) >= 3 {
			return strings.Join(parts[:3], "."), "component", openapi.HumanizePath(path)
		}
		return path, "component", openapi.HumanizePath(path)
	}

	return "(other)", "other", openapi.HumanizePath(path)
}

func splitSpecMethodPath(body string) (apiPath, method, rest string, ok bool) {
	bestIdx := -1
	bestMethod := ""
	bestEnd := -1

	for _, m := range specSupportedMethods {
		pattern := "." + m
		searchPos := 0
		for {
			idx := strings.Index(body[searchPos:], pattern)
			if idx < 0 {
				break
			}
			idx += searchPos
			end := idx + len(pattern)
			if end == len(body) || body[end] == '.' {
				if idx > bestIdx {
					bestIdx = idx
					bestMethod = m
					bestEnd = end
				}
			}
			searchPos = idx + 1
		}
	}

	if bestIdx <= 0 || bestMethod == "" {
		return "", "", "", false
	}

	return body[:bestIdx], bestMethod, body[bestEnd:], true
}

func summarizeSpecRichDiffs(diffs []SpecRichDiffItem) SpecRichSummary {
	summary := SpecRichSummary{}
	for _, diff := range diffs {
		switch diff.Type {
		case "added":
			summary.Added++
		case "removed":
			summary.Removed++
		case "changed":
			summary.Changed++
		case "type_changed":
			summary.TypeChanged++
		}

		if diff.Breaking {
			summary.Breaking++
		}
	}
	return summary
}

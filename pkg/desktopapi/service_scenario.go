package desktopapi

import (
	"fmt"

	"github.com/rea9r/xdiff/internal/output"
	"github.com/rea9r/xdiff/internal/scenario"
)

func (s *Service) RunScenario(req RunScenarioRequest) (*ScenarioRunResponse, error) {
	cfg, err := scenario.LoadFile(req.ScenarioPath)
	if err != nil {
		return &ScenarioRunResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	checks, err := scenario.Resolve(cfg, req.ScenarioPath)
	if err != nil {
		return &ScenarioRunResponse{ExitCode: 2, Error: err.Error()}, nil
	}
	checks, err = scenario.FilterResolvedChecks(checks, req.Only)
	if err != nil {
		return &ScenarioRunResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	summary, results := scenario.RunResolved(checks)
	out, err := renderScenarioReport(req.ReportFormat, summary, results, req.ScenarioPath)
	if err != nil {
		return &ScenarioRunResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	return &ScenarioRunResponse{
		ExitCode: summary.ExitCode,
		Summary: &ScenarioSummary{
			Total:    summary.Total,
			OK:       summary.OK,
			Diff:     summary.Diff,
			Error:    summary.Error,
			ExitCode: summary.ExitCode,
		},
		Results: mapScenarioResults(results),
		Output:  out,
	}, nil
}

func (s *Service) ListScenarioChecks(req ListScenarioChecksRequest) (*ScenarioListResponse, error) {
	cfg, err := scenario.LoadFile(req.ScenarioPath)
	if err != nil {
		return &ScenarioListResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	checks, err := scenario.Resolve(cfg, req.ScenarioPath)
	if err != nil {
		return &ScenarioListResponse{ExitCode: 2, Error: err.Error()}, nil
	}
	checks, err = scenario.FilterResolvedChecks(checks, req.Only)
	if err != nil {
		return &ScenarioListResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	entries := scenario.BuildCheckListEntries(checks, req.ScenarioPath)
	mapped := make([]ScenarioCheckListEntry, 0, len(entries))
	for _, e := range entries {
		mapped = append(mapped, ScenarioCheckListEntry{
			Name:    e.Name,
			Kind:    e.Kind,
			Old:     e.Old,
			New:     e.New,
			Summary: e.Summary,
		})
	}

	out, err := renderScenarioList(req.ReportFormat, checks, req.ScenarioPath)
	if err != nil {
		return &ScenarioListResponse{ExitCode: 2, Error: err.Error()}, nil
	}

	return &ScenarioListResponse{
		ExitCode: 0,
		Checks:   mapped,
		Output:   out,
	}, nil
}

func renderScenarioReport(format string, summary scenario.Summary, results []scenario.Result, scenarioPath string) (string, error) {
	switch format {
	case "", output.TextFormat:
		return scenario.RenderText(summary, results, scenarioPath), nil
	case output.JSONFormat:
		return scenario.RenderJSON(summary, results)
	default:
		return "", fmt.Errorf("invalid report format %q (allowed: text, json)", format)
	}
}

func renderScenarioList(format string, checks []scenario.ResolvedCheck, scenarioPath string) (string, error) {
	switch format {
	case "", output.TextFormat:
		return scenario.RenderCheckListText(checks, scenarioPath), nil
	case output.JSONFormat:
		return scenario.RenderCheckListJSON(checks, scenarioPath)
	default:
		return "", fmt.Errorf("invalid report format %q (allowed: text, json)", format)
	}
}

func mapScenarioResults(in []scenario.Result) []ScenarioResult {
	out := make([]ScenarioResult, 0, len(in))
	for _, r := range in {
		out = append(out, ScenarioResult{
			Name:         r.Name,
			Kind:         r.Kind,
			Status:       r.Status,
			ExitCode:     r.ExitCode,
			DiffFound:    r.DiffFound,
			Output:       r.Output,
			ErrorMessage: r.ErrorMessage,
		})
	}
	return out
}

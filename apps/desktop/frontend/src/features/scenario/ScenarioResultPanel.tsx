import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import type { ScenarioResult, ScenarioRunResponse } from '../../types'
import { CompareResultShell } from '../../ui/CompareResultShell'
import { CompareResultToolbar } from '../../ui/CompareResultToolbar'
import { CompareSearchControls } from '../../ui/CompareSearchControls'
import { CompareStatusBadges, type CompareStatusBadgeItem } from '../../ui/CompareStatusBadges'
import { StatusBadge } from '../../ui/StatusBadge'

export type ScenarioResultPanelProps = {
  scenarioRunResult: ScenarioRunResponse | null
  selectedScenarioResultName: string
  setSelectedScenarioResultName: (value: string) => void
}

function classForStatus(status: string): string {
  if (status === 'ok' || status === 'diff' || status === 'error') return status
  return 'error'
}

function toneForScenarioStatus(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'ok') return 'success'
  if (status === 'diff') return 'warning'
  return 'danger'
}

function getSelectedScenarioResult(
  results: ScenarioResult[],
  selectedScenarioResultName: string,
): ScenarioResult | null {
  if (!selectedScenarioResultName) return null
  return results.find((r) => r.name === selectedScenarioResultName) ?? null
}

function matchesScenarioSearch(result: ScenarioResult, normalizedSearchQuery: string): boolean {
  if (!normalizedSearchQuery) {
    return true
  }

  const haystacks = [
    result.name,
    result.kind,
    result.status,
    result.output ?? '',
    result.errorMessage ?? '',
  ]

  return haystacks.some((value) => value.toLowerCase().includes(normalizedSearchQuery))
}

export function ScenarioResultPanel({
  scenarioRunResult,
  selectedScenarioResultName,
  setSelectedScenarioResultName,
}: ScenarioResultPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'diff' | 'error'>('all')
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)

  const summary = scenarioRunResult?.summary
  const allResults = scenarioRunResult?.results ?? []
  const filteredByStatusResults = useMemo(
    () => allResults.filter((result) => statusFilter === 'all' || result.status === statusFilter),
    [allResults, statusFilter],
  )
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const searchMatches = useMemo(
    () =>
      filteredByStatusResults.filter((result) =>
        matchesScenarioSearch(result, normalizedSearchQuery),
      ),
    [filteredByStatusResults, normalizedSearchQuery],
  )

  useEffect(() => {
    setActiveSearchIndex(0)
  }, [normalizedSearchQuery, statusFilter, scenarioRunResult])

  useEffect(() => {
    if (!normalizedSearchQuery || searchMatches.length === 0) {
      return
    }

    const activeMatch = searchMatches[activeSearchIndex]
    if (!activeMatch) {
      return
    }

    setSelectedScenarioResultName(activeMatch.name)
  }, [activeSearchIndex, normalizedSearchQuery, searchMatches, setSelectedScenarioResultName])

  const moveScenarioSearch = (direction: 1 | -1) => {
    if (!normalizedSearchQuery || searchMatches.length === 0) {
      return
    }

    setActiveSearchIndex((current) => {
      const next = current + direction
      if (next < 0) {
        return searchMatches.length - 1
      }
      if (next >= searchMatches.length) {
        return 0
      }
      return next
    })
  }

  const selectedIndex = selectedScenarioResultName
    ? filteredByStatusResults.findIndex((result) => result.name === selectedScenarioResultName)
    : -1

  const moveScenarioSelection = (key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End') => {
    if (filteredByStatusResults.length === 0) {
      return
    }

    if (key === 'Home') {
      setSelectedScenarioResultName(filteredByStatusResults[0].name)
      return
    }
    if (key === 'End') {
      setSelectedScenarioResultName(filteredByStatusResults[filteredByStatusResults.length - 1].name)
      return
    }

    if (key === 'ArrowDown') {
      const nextIndex =
        selectedIndex >= 0 ? (selectedIndex + 1) % filteredByStatusResults.length : 0
      setSelectedScenarioResultName(filteredByStatusResults[nextIndex].name)
      return
    }

    const nextIndex =
      selectedIndex >= 0
        ? (selectedIndex - 1 + filteredByStatusResults.length) % filteredByStatusResults.length
        : filteredByStatusResults.length - 1
    setSelectedScenarioResultName(filteredByStatusResults[nextIndex].name)
  }

  const handleResultsListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.preventDefault()
      moveScenarioSelection(event.key)
    }
  }

  const summaryBadges: CompareStatusBadgeItem[] = summary
    ? [
        { key: 'ok', label: `ok ${summary.ok}`, tone: 'neutral' },
        { key: 'diff', label: `diff ${summary.diff}`, tone: 'changed' },
        { key: 'error', label: `error ${summary.error}`, tone: 'error' },
      ]
    : []

  const toolbar = (
    <CompareResultToolbar
      primary={
        <>
          <label className="field-label">Scenario results</label>
          <CompareStatusBadges items={summaryBadges} />
        </>
      }
      secondary={
        <>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | 'ok' | 'diff' | 'error')
            }
          >
            <option value="all">all statuses</option>
            <option value="ok">ok</option>
            <option value="diff">diff</option>
            <option value="error">error</option>
          </select>
          <CompareSearchControls
            value={searchQuery}
            placeholder="Search scenario results"
            statusText={
              normalizedSearchQuery
                ? searchMatches.length > 0
                  ? `${activeSearchIndex + 1} / ${searchMatches.length}`
                  : '0 matches'
                : null
            }
            onChange={setSearchQuery}
            onPrev={() => moveScenarioSearch(-1)}
            onNext={() => moveScenarioSearch(1)}
            prevDisabled={!normalizedSearchQuery || searchMatches.length === 0}
            nextDisabled={!normalizedSearchQuery || searchMatches.length === 0}
          />
        </>
      }
    />
  )

  if (!scenarioRunResult) {
    return (
      <CompareResultShell
        toolbar={toolbar}
        hasResult={false}
        emptyState={<div className="muted">(no scenario run yet)</div>}
      >
        <></>
      </CompareResultShell>
    )
  }

  if (scenarioRunResult.error) {
    return (
      <CompareResultShell toolbar={toolbar} hasResult>
        <div className="scenario-result-detail">
          <StatusBadge tone="danger">error</StatusBadge>
          <pre>{scenarioRunResult.error}</pre>
        </div>
      </CompareResultShell>
    )
  }

  const selected =
    getSelectedScenarioResult(filteredByStatusResults, selectedScenarioResultName) ??
    filteredByStatusResults.find((r) => r.status !== 'ok') ??
    filteredByStatusResults[0] ??
    null

  return (
    <CompareResultShell toolbar={toolbar} hasResult>
      <div className="scenario-result-shell">
      {summary ? (
        <div className="scenario-summary-grid">
          <div>
            <strong>exit</strong> {summary.exitCode}
          </div>
          <div>
            <strong>total</strong> {summary.total}
          </div>
          <div>
            <strong>ok</strong> {summary.ok}
          </div>
          <div>
            <strong>diff</strong> {summary.diff}
          </div>
          <div>
            <strong>error</strong> {summary.error}
          </div>
        </div>
      ) : null}

      <div className="scenario-results-layout">
        <div
          className="scenario-results-list"
          role="listbox"
          aria-label="Scenario results list"
          aria-activedescendant={selected?.name ? `scenario-result-${selected.name}` : undefined}
          tabIndex={0}
          onKeyDown={handleResultsListKeyDown}
        >
          {filteredByStatusResults.length === 0 ? (
            <div className="muted">(no results for current filter)</div>
          ) : null}
          {filteredByStatusResults.map((r) => (
            <button
              id={`scenario-result-${r.name}`}
              key={r.name}
              className={`scenario-result-item ${selected?.name === r.name ? 'active' : ''}`}
              onClick={() => setSelectedScenarioResultName(r.name)}
              type="button"
              role="option"
              aria-selected={selected?.name === r.name}
            >
              <div className="scenario-result-item-top">
                <span>{r.name}</span>
                <StatusBadge tone={toneForScenarioStatus(classForStatus(r.status))}>
                  {r.status}
                </StatusBadge>
              </div>
              <div className="scenario-result-item-sub">
                <span>{r.kind}</span>
                <span>exit={r.exitCode}</span>
                <span>diff={r.diffFound ? 'yes' : 'no'}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="scenario-result-detail">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <div className="muted">
                {selected.kind} · status={selected.status} · exit={selected.exitCode} · diff={selected.diffFound ? 'yes' : 'no'}
              </div>
              {selected.errorMessage ? <pre>{selected.errorMessage}</pre> : null}
              {selected.output ? <pre>{selected.output}</pre> : null}
              {!selected.errorMessage && !selected.output ? (
                <div className="muted">(no detail)</div>
              ) : null}
            </>
          ) : (
            <div className="muted">(no selected result)</div>
          )}
        </div>
      </div>
      </div>
    </CompareResultShell>
  )
}

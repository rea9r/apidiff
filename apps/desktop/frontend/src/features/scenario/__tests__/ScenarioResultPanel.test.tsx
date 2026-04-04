import { fireEvent, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, expect, it, vi } from 'vitest'
import { ScenarioResultPanel } from '../ScenarioResultPanel'
import type { ScenarioRunResponse } from '../../../types'

const runResult: ScenarioRunResponse = {
  exitCode: 1,
  summary: {
    total: 3,
    ok: 1,
    diff: 1,
    error: 1,
    exitCode: 1,
  },
  results: [
    { name: 'check-ok', kind: 'json', status: 'ok', exitCode: 0, diffFound: false },
    { name: 'check-diff', kind: 'spec', status: 'diff', exitCode: 1, diffFound: true },
    { name: 'check-error', kind: 'text', status: 'error', exitCode: 2, diffFound: false },
  ],
}

describe('ScenarioResultPanel', () => {
  function renderPanel() {
    return render(
      <MantineProvider>
        <ScenarioResultPanel
          scenarioRunResult={runResult}
          selectedScenarioResultName=""
          setSelectedScenarioResultName={vi.fn()}
        />
      </MantineProvider>,
    )
  }

  it('renders toolbar with status filter and search controls', () => {
    renderPanel()

    expect(screen.getByText('Scenario results')).toBeInTheDocument()
    expect(screen.getByDisplayValue('all statuses')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search scenario results')).toBeInTheDocument()
  })

  it('filters results by selected status', () => {
    renderPanel()

    fireEvent.change(screen.getByDisplayValue('all statuses'), {
      target: { value: 'error' },
    })

    expect(screen.queryByText('check-ok')).toBeNull()
    expect(screen.queryByText('check-diff')).toBeNull()
    expect(screen.getAllByText('check-error').length).toBeGreaterThan(0)
  })
})

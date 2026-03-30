import { useCallback, useState } from 'react'
import { upsertRecentScenarioPath } from '../../persistence'
import type {
  DesktopRecentScenarioPath,
  ScenarioCheckListEntry,
  ScenarioListResponse,
  ScenarioRunResponse,
} from '../../types'

type ScenarioReportFormat = 'text' | 'json'

type UseScenarioWorkflowOptions = {
  listScenarioChecks?: (req: {
    scenarioPath: string
    reportFormat: ScenarioReportFormat
    only: string[]
  }) => Promise<ScenarioListResponse>
  runScenario?: (req: {
    scenarioPath: string
    reportFormat: ScenarioReportFormat
    only: string[]
  }) => Promise<ScenarioRunResponse>
  onEnterScenarioMode?: () => void
  onScenarioRunCompleted?: () => void
}

function chooseInitialScenarioResult(res: ScenarioRunResponse): string {
  const results = res.results ?? []
  if (results.length === 0) return ''

  const firstNonOK = results.find((result) => result.status !== 'ok')
  if (firstNonOK) return firstNonOK.name

  return results[0].name
}

export function useScenarioWorkflow({
  listScenarioChecks,
  runScenario: runScenarioRequest,
  onEnterScenarioMode,
  onScenarioRunCompleted,
}: UseScenarioWorkflowOptions) {
  const [scenarioPath, setScenarioPath] = useState('')
  const [reportFormat, setReportFormat] = useState<ScenarioReportFormat>('text')
  const [scenarioChecks, setScenarioChecks] = useState<ScenarioCheckListEntry[]>([])
  const [selectedChecks, setSelectedChecks] = useState<string[]>([])
  const [scenarioListStatus, setScenarioListStatus] = useState('')
  const [scenarioRunResult, setScenarioRunResult] = useState<ScenarioRunResponse | null>(null)
  const [selectedScenarioResultName, setSelectedScenarioResultName] = useState('')
  const [scenarioRecentPaths, setScenarioRecentPaths] = useState<DesktopRecentScenarioPath[]>([])

  const nowISO = () => new Date().toISOString()

  const updateScenarioRecentPaths = useCallback((path: string, nextReportFormat: ScenarioReportFormat) => {
    if (!path.trim()) {
      return
    }

    setScenarioRecentPaths((prev) =>
      upsertRecentScenarioPath(prev, {
        path,
        reportFormat: nextReportFormat,
        usedAt: nowISO(),
      }),
    )
  }, [])

  const setScenarioRunResultView = useCallback((res: ScenarioRunResponse) => {
    setScenarioRunResult(res)
    setSelectedScenarioResultName(chooseInitialScenarioResult(res))
  }, [])

  const setScenarioRunError = useCallback((errorText: string) => {
    setScenarioRunResult({
      exitCode: 2,
      error: errorText,
    })
    setSelectedScenarioResultName('')
  }, [])

  const loadScenarioRecent = useCallback(
    async (entry: DesktopRecentScenarioPath) => {
      if (!listScenarioChecks) {
        throw new Error('Wails bridge not available (ListScenarioChecks)')
      }

      const path = entry.path
      const nextReportFormat: ScenarioReportFormat = entry.reportFormat === 'json' ? 'json' : 'text'
      const res: ScenarioListResponse = await listScenarioChecks({
        scenarioPath: path,
        reportFormat: nextReportFormat,
        only: [],
      })

      onEnterScenarioMode?.()
      setScenarioPath(path)
      setReportFormat(nextReportFormat)

      if (res.error) {
        setScenarioChecks([])
        setSelectedChecks([])
        setScenarioListStatus(res.error)
        return
      }

      setScenarioChecks(res.checks ?? [])
      setSelectedChecks([])
      setScenarioListStatus(`loaded ${res.checks?.length ?? 0} checks`)
      updateScenarioRecentPaths(path, nextReportFormat)
    },
    [listScenarioChecks, onEnterScenarioMode, updateScenarioRecentPaths],
  )

  const loadScenarioChecks = useCallback(async () => {
    if (!listScenarioChecks) {
      throw new Error('Wails bridge not available (ListScenarioChecks)')
    }

    const res: ScenarioListResponse = await listScenarioChecks({
      scenarioPath,
      reportFormat,
      only: [],
    })

    if (res.error) {
      setScenarioChecks([])
      setSelectedChecks([])
      setScenarioListStatus(res.error)
      return
    }

    setScenarioChecks(res.checks ?? [])
    setSelectedChecks([])
    setScenarioListStatus(`loaded ${res.checks?.length ?? 0} checks`)
    updateScenarioRecentPaths(scenarioPath, reportFormat)
  }, [listScenarioChecks, reportFormat, scenarioPath, updateScenarioRecentPaths])

  const onLoadScenarioChecks = useCallback(async () => {
    try {
      await loadScenarioChecks()
    } catch (error) {
      setScenarioChecks([])
      setSelectedChecks([])
      setScenarioListStatus(String(error))
    }
  }, [loadScenarioChecks])

  const runScenario = useCallback(async () => {
    if (!runScenarioRequest) {
      throw new Error('Wails bridge not available (RunScenario)')
    }

    const res: ScenarioRunResponse = await runScenarioRequest({
      scenarioPath,
      reportFormat,
      only: selectedChecks,
    })

    setScenarioRunResultView(res)
    onScenarioRunCompleted?.()

    if (!res.error) {
      updateScenarioRecentPaths(scenarioPath, reportFormat)
    }
  }, [
    onScenarioRunCompleted,
    reportFormat,
    runScenarioRequest,
    scenarioPath,
    selectedChecks,
    setScenarioRunResultView,
    updateScenarioRecentPaths,
  ])

  const toggleScenarioCheck = useCallback((name: string, checked: boolean) => {
    setSelectedChecks((prev) => {
      if (checked) {
        if (prev.includes(name)) return prev
        return [...prev, name]
      }
      return prev.filter((value) => value !== name)
    })
  }, [])

  const selectAllScenarioChecks = useCallback(() => {
    setSelectedChecks(scenarioChecks.map((check) => check.name))
  }, [scenarioChecks])

  const clearScenarioSelection = useCallback(() => {
    setSelectedChecks([])
  }, [])

  return {
    scenarioPath,
    setScenarioPath,
    reportFormat,
    setReportFormat,
    scenarioChecks,
    selectedChecks,
    scenarioListStatus,
    scenarioRunResult,
    selectedScenarioResultName,
    setSelectedScenarioResultName,
    scenarioRecentPaths,
    setScenarioRecentPaths,
    loadScenarioRecent,
    runScenario,
    onLoadScenarioChecks,
    toggleScenarioCheck,
    selectAllScenarioChecks,
    clearScenarioSelection,
    setScenarioRunError,
  }
}

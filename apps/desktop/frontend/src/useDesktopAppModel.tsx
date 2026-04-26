import { useDesktopBridge } from './useDesktopBridge'
import { useBrowseAndSet } from './useBrowseAndSet'
import { useDesktopRecentPairs } from './useDesktopRecentPairs'
import { useDesktopPersistence } from './useDesktopPersistence'
import { useRecentActionRunner } from './useRecentActionRunner'
import { useDesktopHeaderActions } from './useDesktopHeaderActions'
import { useDesktopShellModel } from './useDesktopShellModel'
import { useDesktopTabModel } from './useDesktopTabModel'

export type UseDesktopAppModelOptions = {
  enabled?: boolean
}

export function useDesktopAppModel({ enabled = true }: UseDesktopAppModelOptions = {}) {
  const api = useDesktopBridge()
  const recentPairs = useDesktopRecentPairs()

  const tab = useDesktopTabModel({ api, recentPairs })
  const { mode, setMode, onModeChange, compareOptionsOpened, setCompareOptionsOpened, loading } =
    tab
  const { textModel, jsonModel, directoryModel } = tab

  // --- Persistence ---

  useDesktopPersistence({
    enabled,
    mode,
    setMode,
    loadDesktopState: api.loadDesktopState,
    saveDesktopState: api.saveDesktopState,
    loadTextFile: api.loadTextFile,
    json: {
      oldSourcePath: jsonModel.workflow.jsonOldSourcePath,
      newSourcePath: jsonModel.workflow.jsonNewSourcePath,
      ignoreOrder: jsonModel.workflow.ignoreOrder,
      common: jsonModel.workflow.jsonCommon,
      recentPairs: recentPairs.jsonRecentPairs,
      setIgnoreOrder: jsonModel.workflow.setIgnoreOrder,
      setCommon: jsonModel.workflow.setJSONCommon,
      setIgnorePathsDraft: jsonModel.workflow.setJSONIgnorePathsDraft,
      setOldSourcePath: jsonModel.workflow.setJSONOldSourcePath,
      setNewSourcePath: jsonModel.workflow.setJSONNewSourcePath,
      setRecentPairs: recentPairs.setJSONRecentPairs,
      setOldText: jsonModel.workflow.setJSONOldText,
      setNewText: jsonModel.workflow.setJSONNewText,
    },
    text: {
      oldSourcePath: textModel.workflow.textOldSourcePath,
      newSourcePath: textModel.workflow.textNewSourcePath,
      common: textModel.workflow.textCommon,
      diffLayout: textModel.viewState.textDiffLayout,
      recentPairs: recentPairs.textRecentPairs,
      setCommon: textModel.workflow.setTextCommon,
      setDiffLayout: textModel.viewState.setTextDiffLayout,
      setOldSourcePath: textModel.workflow.setTextOldSourcePath,
      setNewSourcePath: textModel.workflow.setTextNewSourcePath,
      setRecentPairs: recentPairs.setTextRecentPairs,
      setOldText: textModel.workflow.setTextOld,
      setNewText: textModel.workflow.setTextNew,
    },
    directory: {
      leftRoot: directoryModel.state.directoryLeftRoot,
      rightRoot: directoryModel.state.directoryRightRoot,
      currentPath: directoryModel.state.directoryCurrentPath,
      viewMode: directoryModel.viewState.directoryViewMode,
      recentPairs: recentPairs.directoryRecentPairs,
      setLeftRoot: directoryModel.state.setDirectoryLeftRoot,
      setRightRoot: directoryModel.state.setDirectoryRightRoot,
      setCurrentPath: directoryModel.state.setDirectoryCurrentPath,
      setViewMode: directoryModel.viewState.setDirectoryViewMode,
      setRecentPairs: recentPairs.setDirectoryRecentPairs,
    },
  })

  // --- UI chrome ---

  useBrowseAndSet({ setSummaryLine: tab.setSummaryLine, setOutput: tab.setOutput })
  const { runRecentAction } = useRecentActionRunner({ setLoading: tab.setLoading })

  const { headerActions } = useDesktopHeaderActions({
    mode,
    loading,
    compareOptionsOpened,
    onToggleCompareOptions: () => setCompareOptionsOpened((prev) => !prev),
    jsonCompareDisabled: jsonModel.compareDisabled,
    directoryCompareDisabled: directoryModel.compareDisabled,
    onRun: tab.onRun,
    jsonRecentPairs: recentPairs.jsonRecentPairs,
    onClearJSONRecent: () => recentPairs.setJSONRecentPairs([]),
    textRecentPairs: recentPairs.textRecentPairs,
    onClearTextRecent: () => recentPairs.setTextRecentPairs([]),
    directoryRecentPairs: recentPairs.directoryRecentPairs,
    onClearDirectoryRecent: () => recentPairs.setDirectoryRecentPairs([]),
    runRecentAction,
    runTextFromRecent: textModel.workflow.runTextFromRecent,
    clearTextExpandedSections: textModel.viewState.clearTextExpandedSections,
    resetTextSearch: textModel.viewState.resetTextSearch,
    runJSONFromRecent: jsonModel.workflow.runJSONFromRecent,
    applyJSONResultView: directoryModel.childDiffOpeners.applyJSONResultView,
    runDirectoryFromRecent: directoryModel.interactions.runDirectoryFromRecent,
    setMode,
  })

  const { layoutMode, sidebar, main, inspector, inspectorOpen } = useDesktopShellModel({
    mode,
    setMode,
    loading,
    compareOptionsOpened,
    onCloseCompareOptions: () => setCompareOptionsOpened(false),
    jsonWorkflow: jsonModel.workflow,
    jsonViewState: jsonModel.viewState,
    textWorkflow: textModel.workflow,
    textViewState: textModel.viewState,
    directoryLeftRoot: directoryModel.state.directoryLeftRoot,
    directoryRightRoot: directoryModel.state.directoryRightRoot,
    directoryNameFilter: directoryModel.state.directoryNameFilter,
    setDirectoryNameFilter: directoryModel.state.setDirectoryNameFilter,
    directoryCurrentPath: directoryModel.state.directoryCurrentPath,
    directoryResult: directoryModel.state.directoryResult,
    directoryStatus: directoryModel.state.directoryStatus,
    directoryViewState: directoryModel.viewState,
    directoryWorkflow: directoryModel.workflow,
    directoryChildDiffActions: directoryModel.childDiffActions,
    directoryInteractions: directoryModel.interactions,
  })

  return {
    mode,
    onModeChange,
    layoutMode,
    sidebar,
    headerActions,
    main,
    inspector,
    inspectorOpen,
  }
}

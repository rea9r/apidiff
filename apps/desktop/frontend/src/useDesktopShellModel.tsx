import type { ReactNode } from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import type {
  CompareFoldersResponse,
  Mode,
} from './types'
import { parseIgnorePaths } from './utils/appHelpers'
import { useBrowseAndSet } from './useBrowseAndSet'
import { useDesktopBridge } from './useDesktopBridge'
import { useRecentActionRunner } from './useRecentActionRunner'
import { DesktopCompareOptionsContent } from './ui/DesktopCompareOptionsContent'
import { DesktopMainContent } from './ui/DesktopMainContent'
import { useDirectoryCompareViewState } from './features/folder/useDirectoryCompareViewState'
import { useDirectoryCompareWorkflow } from './features/folder/useDirectoryCompareWorkflow'
import { useDirectoryCompareChildDiffActions } from './features/folder/useDirectoryCompareChildDiffActions'
import { useDirectoryCompareInteractions } from './features/folder/useDirectoryCompareInteractions'
import { useTextDiffViewState } from './features/text/useTextDiffViewState'
import { useTextCompareWorkflow } from './features/text/useTextCompareWorkflow'
import { useJSONCompareViewState } from './features/json/useJSONCompareViewState'
import { useJSONCompareWorkflow } from './features/json/useJSONCompareWorkflow'
import { useSpecCompareViewState } from './features/spec/useSpecCompareViewState'
import { useSpecCompareWorkflow } from './features/spec/useSpecCompareWorkflow'
import { useScenarioWorkflow } from './features/scenario/useScenarioWorkflow'

type DesktopShellModel = {
  layoutMode: 'workspace' | 'sidebar'
  sidebar: ReactNode | undefined
  main: ReactNode
  inspector: ReactNode | undefined
  inspectorOpen: boolean
}

type UseDesktopShellModelArgs = {
  mode: Mode
  loading: boolean
  compareOptionsOpened: boolean
  onCloseCompareOptions: () => void
  browseAndSet: ReturnType<typeof useBrowseAndSet>['browseAndSet']
  pickScenarioFile: ReturnType<typeof useDesktopBridge>['pickScenarioFile']
  runRecentAction: ReturnType<typeof useRecentActionRunner>['runRecentAction']
  handleLoadScenarioChecks: () => void
  onRun: () => void
  jsonWorkflow: ReturnType<typeof useJSONCompareWorkflow>
  jsonViewState: ReturnType<typeof useJSONCompareViewState>
  specWorkflow: ReturnType<typeof useSpecCompareWorkflow>
  specViewState: ReturnType<typeof useSpecCompareViewState>
  textWorkflow: ReturnType<typeof useTextCompareWorkflow>
  textViewState: ReturnType<typeof useTextDiffViewState>
  scenarioWorkflow: ReturnType<typeof useScenarioWorkflow>
  folderLeftRoot: string
  folderRightRoot: string
  folderNameFilter: string
  setFolderNameFilter: (value: string) => void
  folderCurrentPath: string
  folderResult: CompareFoldersResponse | null
  folderStatus: string
  folderViewState: ReturnType<typeof useDirectoryCompareViewState>
  folderWorkflow: ReturnType<typeof useDirectoryCompareWorkflow>
  folderChildDiffActions: ReturnType<typeof useDirectoryCompareChildDiffActions>
  folderInteractions: ReturnType<typeof useDirectoryCompareInteractions>
}

export function useDesktopShellModel({
  mode,
  loading,
  compareOptionsOpened,
  onCloseCompareOptions,
  browseAndSet,
  pickScenarioFile,
  runRecentAction,
  handleLoadScenarioChecks,
  onRun,
  jsonWorkflow,
  jsonViewState,
  specWorkflow,
  specViewState,
  textWorkflow,
  textViewState,
  scenarioWorkflow,
  folderLeftRoot,
  folderRightRoot,
  folderNameFilter,
  setFolderNameFilter,
  folderCurrentPath,
  folderResult,
  folderStatus,
  folderViewState,
  folderWorkflow,
  folderChildDiffActions,
  folderInteractions,
}: UseDesktopShellModelArgs): DesktopShellModel {
  const isCompareCentricMode = mode === 'text' || mode === 'json' || mode === 'spec'

  const compareOptionsTitle =
    mode === 'text'
      ? 'Text compare options'
      : mode === 'json'
        ? 'JSON compare options'
        : 'Spec compare options'

  const compareOptionsContent = (
    <DesktopCompareOptionsContent
      mode={mode}
      jsonProps={{
        ignoreOrder: jsonWorkflow.ignoreOrder,
        onIgnoreOrderChange: jsonWorkflow.setIgnoreOrder,
        outputFormat: jsonWorkflow.jsonCommon.outputFormat,
        onOutputFormatChange: (value) => jsonWorkflow.updateJSONCommon('outputFormat', value),
        textStyle: jsonWorkflow.jsonCommon.textStyle,
        onTextStyleChange: (value) => jsonWorkflow.updateJSONCommon('textStyle', value),
        patchTextStyleDisabled: jsonWorkflow.jsonPatchBlockedByFilters,
        failOn: jsonWorkflow.jsonCommon.failOn,
        onFailOnChange: (value) => jsonWorkflow.updateJSONCommon('failOn', value),
        ignorePathsDraft: jsonWorkflow.jsonIgnorePathsDraft,
        onIgnorePathsDraftChange: jsonWorkflow.setJSONIgnorePathsDraft,
        onIgnorePathsCommit: (value) =>
          jsonWorkflow.updateJSONCommon('ignorePaths', parseIgnorePaths(value)),
        showPaths: jsonWorkflow.jsonCommon.showPaths,
        onShowPathsChange: (checked) => jsonWorkflow.updateJSONCommon('showPaths', checked),
        onlyBreaking: jsonWorkflow.jsonCommon.onlyBreaking,
        onOnlyBreakingChange: (checked) =>
          jsonWorkflow.updateJSONCommon('onlyBreaking', checked),
      }}
      specProps={{
        outputFormat: specWorkflow.specCommon.outputFormat,
        onOutputFormatChange: (value) => specWorkflow.updateSpecCommon('outputFormat', value),
        textStyle: specWorkflow.specCommon.textStyle,
        onTextStyleChange: (value) => specWorkflow.updateSpecCommon('textStyle', value),
        failOn: specWorkflow.specCommon.failOn,
        onFailOnChange: (value) => specWorkflow.updateSpecCommon('failOn', value),
        ignorePathsDraft: specWorkflow.specIgnorePathsDraft,
        onIgnorePathsDraftChange: specWorkflow.setSpecIgnorePathsDraft,
        onIgnorePathsCommit: (value) =>
          specWorkflow.updateSpecCommon('ignorePaths', parseIgnorePaths(value)),
        showPaths: specWorkflow.specCommon.showPaths,
        onShowPathsChange: (checked) => specWorkflow.updateSpecCommon('showPaths', checked),
        onlyBreaking: specWorkflow.specCommon.onlyBreaking,
        onOnlyBreakingChange: (checked) =>
          specWorkflow.updateSpecCommon('onlyBreaking', checked),
      }}
      textProps={{
        outputFormat: textWorkflow.textCommon.outputFormat,
        onOutputFormatChange: (value) => textWorkflow.updateTextCommon('outputFormat', value),
        failOn: textWorkflow.textCommon.failOn,
        onFailOnChange: (value) => textWorkflow.updateTextCommon('failOn', value),
      }}
    />
  )

  const scenarioSourceProps = {
    scenarioPath: scenarioWorkflow.scenarioPath,
    onScenarioPathChange: scenarioWorkflow.setScenarioPath,
    onBrowseScenario: () =>
      void browseAndSet(pickScenarioFile, scenarioWorkflow.setScenarioPath),
    scenarioRecentPaths: scenarioWorkflow.scenarioRecentPaths,
    onLoadRecentScenario: (entry: (typeof scenarioWorkflow.scenarioRecentPaths)[number]) =>
      void runRecentAction('Recent scenario load', () =>
        scenarioWorkflow.loadScenarioRecent(entry),
      ),
    onClearRecentScenarios: () => scenarioWorkflow.setScenarioRecentPaths([]),
    reportFormat: scenarioWorkflow.reportFormat,
    onReportFormatChange: scenarioWorkflow.setReportFormat,
    loading,
    onLoadChecks: handleLoadScenarioChecks,
    onRun,
    scenarioListStatus: scenarioWorkflow.scenarioListStatus,
    scenarioChecks: scenarioWorkflow.scenarioChecks,
    selectedChecks: scenarioWorkflow.selectedChecks,
    onToggleCheck: scenarioWorkflow.toggleScenarioCheck,
    onSelectAllChecks: scenarioWorkflow.selectAllScenarioChecks,
    onClearCheckSelection: scenarioWorkflow.clearScenarioSelection,
  }

  const sidebar = undefined

  const main = (
    <DesktopMainContent
      mode={mode}
      showFolderReturnBanner={isCompareCentricMode && !!folderChildDiffActions.folderReturnContext}
      onReturnToFolderCompare={folderChildDiffActions.returnToFolderCompare}
      textSourceProps={{
        oldSourcePath: textWorkflow.textOldSourcePath,
        newSourcePath: textWorkflow.textNewSourcePath,
        oldValue: textWorkflow.textOld,
        newValue: textWorkflow.textNew,
        busy: textWorkflow.textEditorBusy,
        fileBusyTarget: textWorkflow.textFileBusyTarget,
        clipboardBusyTarget: textWorkflow.textClipboardBusyTarget,
        copyBusyTarget: textWorkflow.textPaneCopyBusyTarget,
        onOpenFile: (target) => void textWorkflow.loadTextFromFile(target),
        onPasteClipboard: (target) => void textWorkflow.pasteTextFromClipboard(target),
        onCopyInput: (target) => void textWorkflow.copyTextInput(target),
        onClearInput: textWorkflow.clearTextInput,
        onOldChange: textWorkflow.setTextOldInput,
        onNewChange: textWorkflow.setTextNewInput,
      }}
      textResultProps={{
        textResult: textWorkflow.textResult,
        textResultView: textViewState.textResultView,
        setTextResultView: textViewState.setTextResultView,
        textDiffLayout: textViewState.textDiffLayout,
        setTextDiffLayout: textViewState.setTextDiffLayout,
        textSearchQuery: textViewState.textSearchQuery,
        setTextSearchQuery: textViewState.setTextSearchQuery,
        textActiveSearchIndex: textViewState.textActiveSearchIndex,
        normalizedTextSearchQuery: textViewState.normalizedTextSearchQuery,
        textSearchMatches: textViewState.textSearchMatches,
        textRichRows: textViewState.textRichRows,
        textRichItems: textViewState.textRichItems,
        omittedSectionIds: textViewState.omittedSectionIds,
        allOmittedSectionsExpanded: textViewState.allOmittedSectionsExpanded,
        canRenderTextRich: textViewState.canRenderTextRich,
        textCopyBusy: textWorkflow.textCopyBusy,
        copyTextResultRawOutput: textWorkflow.copyTextResultRawOutput,
        moveTextSearch: textViewState.moveTextSearch,
        toggleTextUnchangedSection: textViewState.toggleTextUnchangedSection,
        toggleAllTextUnchangedSections: textViewState.toggleAllTextUnchangedSections,
        isTextSectionExpanded: textViewState.isTextSectionExpanded,
        registerTextSearchRowRef: textViewState.registerTextSearchRowRef,
      }}
      jsonSourceProps={{
        oldSourcePath: jsonWorkflow.jsonOldSourcePath,
        newSourcePath: jsonWorkflow.jsonNewSourcePath,
        oldValue: jsonWorkflow.jsonOldText,
        newValue: jsonWorkflow.jsonNewText,
        oldParseError: jsonWorkflow.jsonOldParseError,
        newParseError: jsonWorkflow.jsonNewParseError,
        busy: jsonWorkflow.jsonEditorBusy,
        fileBusyTarget: jsonWorkflow.jsonFileBusyTarget,
        clipboardBusyTarget: jsonWorkflow.jsonClipboardBusyTarget,
        copyBusyTarget: jsonWorkflow.jsonCopyBusyTarget,
        onOpenFile: (target) => void jsonWorkflow.loadJSONFromFile(target),
        onPasteClipboard: (target) => void jsonWorkflow.pasteJSONFromClipboard(target),
        onCopyInput: (target) => void jsonWorkflow.copyJSONInput(target),
        onClearInput: jsonWorkflow.clearJSONInput,
        onOldChange: jsonWorkflow.setJSONOldInput,
        onNewChange: jsonWorkflow.setJSONNewInput,
      }}
      jsonResultProps={{
        jsonResult: jsonViewState.jsonResult,
        jsonResultView: jsonViewState.jsonResultView,
        setJSONResultView: jsonViewState.setJSONResultView,
        textDiffLayout: textViewState.textDiffLayout,
        setTextDiffLayout: textViewState.setTextDiffLayout,
        jsonSearchQuery: jsonViewState.jsonSearchQuery,
        setJSONSearchQuery: jsonViewState.setJSONSearchQuery,
        jsonActiveSearchIndex: jsonViewState.jsonActiveSearchIndex,
        normalizedJSONSearchQuery: jsonViewState.normalizedJSONSearchQuery,
        jsonSearchMatches: jsonViewState.jsonSearchMatches,
        jsonDiffSearchMatches: jsonViewState.jsonDiffSearchMatches,
        jsonDiffSearchMatchIds: jsonViewState.jsonDiffSearchMatchIds,
        activeJSONDiffSearchMatchId: jsonViewState.activeJSONDiffSearchMatchId,
        canRenderJSONRich: jsonViewState.canRenderJSONRich,
        canRenderJSONDiff: jsonViewState.canRenderJSONDiff,
        jsonCopyBusy: jsonWorkflow.jsonCopyBusy,
        copyJSONResultRawOutput: jsonWorkflow.copyJSONResultRawOutput,
        moveJSONSearch: jsonViewState.moveJSONSearch,
        jsonDiffTextItems: jsonViewState.jsonDiffTextItems,
        jsonDiffRows: jsonViewState.jsonDiffRows,
        jsonSummary: jsonWorkflow.jsonRichResult?.summary,
        jsonDiffGroups: jsonViewState.jsonDiffGroups,
        effectiveJSONExpandedGroups: jsonViewState.effectiveJSONExpandedGroups,
        jsonSearchMatchIndexSet: jsonViewState.jsonSearchMatchIndexSet,
        jsonExpandedValueKeys: jsonViewState.jsonExpandedValueKeys,
        toggleJSONGroup: jsonViewState.toggleJSONGroup,
        toggleJSONExpandedValue: jsonViewState.toggleJSONExpandedValue,
        registerJSONDiffSearchRowRef: jsonViewState.registerJSONDiffSearchRowRef,
      }}
      specSourceProps={{
        oldSourcePath: specWorkflow.specOldSourcePath,
        newSourcePath: specWorkflow.specNewSourcePath,
        oldValue: specWorkflow.specOldText,
        newValue: specWorkflow.specNewText,
        oldLanguage: specWorkflow.specOldLanguage,
        newLanguage: specWorkflow.specNewLanguage,
        oldParseError: specWorkflow.specOldParseError,
        newParseError: specWorkflow.specNewParseError,
        busy: specWorkflow.specEditorBusy,
        fileBusyTarget: specWorkflow.specFileBusyTarget,
        clipboardBusyTarget: specWorkflow.specClipboardBusyTarget,
        copyBusyTarget: specWorkflow.specCopyBusyTarget,
        onOpenFile: (target) => void specWorkflow.loadSpecFromFile(target),
        onPasteClipboard: (target) => void specWorkflow.pasteSpecFromClipboard(target),
        onCopyInput: (target) => void specWorkflow.copySpecInput(target),
        onClearInput: specWorkflow.clearSpecInput,
        onOldChange: specWorkflow.setSpecOldInput,
        onNewChange: specWorkflow.setSpecNewInput,
      }}
      specResultProps={{
        specResult: specViewState.specResult,
        specRichResult: specWorkflow.specRichResult,
        specResultView: specViewState.specResultView,
        setSpecResultView: specViewState.setSpecResultView,
        textDiffLayout: textViewState.textDiffLayout,
        setTextDiffLayout: textViewState.setTextDiffLayout,
        specSearchQuery: specViewState.specSearchQuery,
        setSpecSearchQuery: specViewState.setSpecSearchQuery,
        specActiveSearchIndex: specViewState.specActiveSearchIndex,
        normalizedSpecSearchQuery: specViewState.normalizedSpecSearchQuery,
        specSearchMatches: specViewState.specSearchMatches,
        specDiffSearchMatches: specViewState.specDiffSearchMatches,
        specDiffSearchMatchIds: specViewState.specDiffSearchMatchIds,
        activeSpecDiffSearchMatchId: specViewState.activeSpecDiffSearchMatchId,
        canRenderSpecDiff: specViewState.canRenderSpecDiff,
        specCopyBusy: specWorkflow.specCopyBusy,
        copySpecResultRawOutput: specWorkflow.copySpecResultRawOutput,
        moveSpecSearch: specViewState.moveSpecSearch,
        specDiffTextItems: specViewState.specDiffTextItems,
        specSearchMatchIndexSet: specViewState.specSearchMatchIndexSet,
        registerSpecDiffSearchRowRef: specViewState.registerSpecDiffSearchRowRef,
      }}
      folderResultProps={{
        folderResult,
        folderStatus,
        folderLeftRoot,
        folderRightRoot,
        folderNameFilter,
        folderCurrentPath,
        folderViewMode: folderViewState.folderViewMode,
        folderQuickFilter: folderViewState.folderQuickFilter,
        folderQuickFilterCounts: folderViewState.folderQuickFilterCounts,
        folderSortKey: folderViewState.folderSortKey,
        folderSortDirection: folderViewState.folderSortDirection,
        folderOpenBusyPath: folderChildDiffActions.folderOpenBusyPath,
        folderTreeLoadingPath: folderViewState.folderTreeLoadingPath,
        selectedFolderItemPath: folderViewState.selectedFolderItemPath,
        sortedFolderItems: folderViewState.sortedFolderItems,
        flattenedFolderTreeRows: folderViewState.flattenedFolderTreeRows,
        selectedFolderItemForDetail: folderViewState.selectedFolderItemForDetail,
        folderBreadcrumbs: folderViewState.folderBreadcrumbs,
        loading,
        onBrowseFolderRoot: folderWorkflow.browseFolderRoot,
        onSetFolderNameFilter: setFolderNameFilter,
        onSetFolderViewMode: folderViewState.setFolderViewMode,
        onSetFolderQuickFilter: folderViewState.setFolderQuickFilter,
        onSelectFolderItemPath: folderViewState.setSelectedFolderItemPath,
        onNavigateFolderPath: folderInteractions.navigateFolderPath,
        onApplyFolderSort: folderViewState.applyFolderSort,
        onOpenFolderEntryDiff: folderChildDiffActions.openFolderEntryDiff,
        onToggleFolderTreeNode: folderViewState.toggleFolderTreeNode,
        onFolderRowDoubleClick: folderInteractions.handleFolderRowDoubleClick,
        onFolderTreeRowDoubleClick: folderInteractions.handleFolderTreeRowDoubleClick,
        onFolderTableKeyDown: (event) =>
          void folderInteractions.handleFolderTableKeyDown(event),
      }}
      scenarioSourceProps={scenarioSourceProps}
      scenarioResultProps={{
        scenarioRunResult: scenarioWorkflow.scenarioRunResult,
        selectedScenarioResultName: scenarioWorkflow.selectedScenarioResultName,
        setSelectedScenarioResultName: scenarioWorkflow.setSelectedScenarioResultName,
      }}
    />
  )

  const inspector = isCompareCentricMode ? (
    <div className="workspace-inspector-panel">
      <div className="workspace-inspector-header">
        <h3>{compareOptionsTitle}</h3>
        <Tooltip label="Close options">
          <ActionIcon
            variant="default"
            size={26}
            aria-label="Close options"
            onClick={onCloseCompareOptions}
          >
            <IconChevronDown size={14} />
          </ActionIcon>
        </Tooltip>
      </div>
      <div className="workspace-inspector-body">{compareOptionsContent}</div>
    </div>
  ) : undefined

  return {
    layoutMode:
      isCompareCentricMode || mode === 'folder' || mode === 'scenario'
        ? 'workspace'
        : 'sidebar',
    sidebar,
    main,
    inspector,
    inspectorOpen: isCompareCentricMode && compareOptionsOpened,
  }
}

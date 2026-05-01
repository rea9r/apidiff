import { act, renderHook } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { TextChangeBlock } from '../features/text/textDiff'
import type { Mode } from '../types'
import { useDesktopShellModel } from '../useDesktopShellModel'

vi.mock('../utils/notifications', () => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
  showAdoptNotification: vi.fn(),
  showClipboardEmptyNotification: vi.fn(),
  showClipboardUnavailableNotification: vi.fn(),
}))

type ShellArgs = Parameters<typeof useDesktopShellModel>[0]

const baseTextCommon = {
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreEOL: false,
  outputFormat: 'text',
  textStyle: 'auto',
  ignorePaths: [],
}

const baseJSONCommon = {
  outputFormat: 'text',
  textStyle: 'auto',
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreEOL: false,
  ignorePaths: [],
}

type FixedShellInputs = {
  mode?: Mode
  textOldSourcePath?: string
  textNewSourcePath?: string
  setMode?: (m: Mode) => void
  setTextOld?: (v: string) => void
  setTextNew?: (v: string) => void
  runTextDiffWithValues?: (...args: unknown[]) => Promise<unknown>
  saveTextSide?: (...args: unknown[]) => Promise<boolean>
  setJSONOldInput?: (v: string) => void
  setJSONNewInput?: (v: string) => void
}

function makeShellArgs(
  textOld: string,
  textNew: string,
  fixed: FixedShellInputs = {},
): ShellArgs {
  const textWorkflow = {
    textOld,
    textNew,
    textOldSourcePath: fixed.textOldSourcePath ?? '',
    textNewSourcePath: fixed.textNewSourcePath ?? '',
    textOldEncoding: 'utf-8',
    textNewEncoding: 'utf-8',
    textEditorBusy: false,
    textFileBusyTarget: null,
    textClipboardBusyTarget: null,
    textPaneCopyBusyTarget: null,
    textSaveBusyTarget: null,
    textCopyBusy: false,
    textResult: null,
    textCommon: baseTextCommon,
    setTextOld: fixed.setTextOld ?? vi.fn(),
    setTextNew: fixed.setTextNew ?? vi.fn(),
    setTextOldInput: vi.fn(),
    setTextNewInput: vi.fn(),
    runTextDiffWithValues:
      fixed.runTextDiffWithValues ?? vi.fn().mockResolvedValue(undefined),
    saveTextSide: fixed.saveTextSide ?? vi.fn().mockResolvedValue(true),
    loadTextFromFile: vi.fn(),
    pasteTextFromClipboard: vi.fn(),
    copyTextInput: vi.fn(),
    clearTextInput: vi.fn(),
    reloadTextWithEncoding: vi.fn(),
    copyTextResultRawOutput: vi.fn(),
    updateTextCommon: vi.fn(),
  }

  const jsonWorkflow = {
    jsonOldText: '',
    jsonNewText: '',
    jsonOldSourcePath: '',
    jsonNewSourcePath: '',
    jsonOldParseError: null,
    jsonNewParseError: null,
    jsonEditorBusy: false,
    jsonFileBusyTarget: null,
    jsonClipboardBusyTarget: null,
    jsonCopyBusyTarget: null,
    jsonCopyBusy: false,
    jsonRichResult: null,
    jsonCommon: baseJSONCommon,
    ignoreOrder: false,
    jsonPatchBlockedByFilters: false,
    jsonIgnorePathsDraft: '',
    setJSONOldInput: fixed.setJSONOldInput ?? vi.fn(),
    setJSONNewInput: fixed.setJSONNewInput ?? vi.fn(),
    setIgnoreOrder: vi.fn(),
    setJSONIgnorePathsDraft: vi.fn(),
    updateJSONCommon: vi.fn(),
    loadJSONFromFile: vi.fn(),
    pasteJSONFromClipboard: vi.fn(),
    copyJSONInput: vi.fn(),
    clearJSONInput: vi.fn(),
    copyJSONResultRawOutput: vi.fn(),
  }

  const textViewState = {
    textResultView: 'diff',
    setTextResultView: vi.fn(),
    textDiffLayout: 'split',
    setTextDiffLayout: vi.fn(),
    textWrap: false,
    setTextWrap: vi.fn(),
    textSearchQuery: '',
    setTextSearchQuery: vi.fn(),
    textActiveSearchIndex: -1,
    normalizedTextSearchQuery: '',
    textSearchMatches: [],
    textRichRows: [],
    textRichItems: [],
    omittedSectionIds: [],
    allOmittedSectionsExpanded: false,
    canRenderTextRich: false,
    moveTextSearch: vi.fn(),
    toggleAllTextUnchangedSections: vi.fn(),
    getTextSectionExpansion: vi.fn(),
    expandTextSection: vi.fn(),
    registerTextSearchRowRef: vi.fn(),
    textDiffBlocks: [],
    textChangeBlocks: [],
    textActiveDiffIndex: -1,
    activeTextDiffBlock: null,
    moveTextDiff: vi.fn(),
  }

  const jsonViewState = {
    jsonResult: null,
    jsonResultView: 'diff',
    setJSONResultView: vi.fn(),
    jsonSearchQuery: '',
    setJSONSearchQuery: vi.fn(),
    jsonActiveSearchIndex: -1,
    normalizedJSONSearchQuery: '',
    jsonSearchMatches: [],
    jsonDiffSearchMatches: [],
    jsonDiffSearchMatchIds: [],
    activeJSONDiffSearchMatchId: null,
    canRenderJSONRich: false,
    canRenderJSONDiff: false,
    moveJSONSearch: vi.fn(),
    jsonDiffTextItems: [],
    jsonDiffRows: [],
    jsonDiffGroups: [],
    effectiveJSONExpandedGroups: new Set<string>(),
    jsonSearchMatchIndexSet: new Set<number>(),
    jsonExpandedValueKeys: new Set<string>(),
    toggleJSONGroup: vi.fn(),
    toggleJSONExpandedValue: vi.fn(),
    registerJSONDiffSearchRowRef: vi.fn(),
    jsonDiffNavCount: 0,
    jsonActiveDiffIndex: -1,
    activeJSONSemanticDiffIndex: -1,
    jsonDiffTextBlockIds: [],
    activeJSONDiffTextBlockId: null,
    moveJSONDiff: vi.fn(),
    registerJSONSemanticDiffRowRef: vi.fn(),
  }

  const directoryViewState = {
    directoryViewMode: 'list',
    directoryQuickFilter: 'all',
    directoryQuickFilterCounts: {
      all: 0,
      changed: 0,
      'left-only': 0,
      'right-only': 0,
      'type-mismatch': 0,
      error: 0,
      same: 0,
    },
    directorySortKey: 'name',
    directorySortDirection: 'asc',
    directoryTreeLoadingPath: null,
    selectedDirectoryItemPath: '',
    sortedDirectoryItems: [],
    flattenedDirectoryTreeRows: [],
    directoryBreadcrumbs: [],
    setDirectoryViewMode: vi.fn(),
    setDirectoryQuickFilter: vi.fn(),
    setSelectedDirectoryItemPath: vi.fn(),
    applyDirectorySort: vi.fn(),
    toggleDirectoryTreeNode: vi.fn(),
  }

  const directoryWorkflow = {
    browseDirectoryRoot: vi.fn(),
  }

  const directoryChildDiffActions = {
    directoryReturnContext: null,
    returnToDirectoryDiff: vi.fn(),
    directoryOpenBusyPath: null,
    openDirectoryEntryDiff: vi.fn(),
  }

  const directoryInteractions = {
    navigateDirectoryPath: vi.fn(),
    handleDirectoryRowDoubleClick: vi.fn(),
    handleDirectoryTreeRowDoubleClick: vi.fn(),
    handleDirectoryTableKeyDown: vi.fn(),
    handleDirectoryTreeKeyDown: vi.fn(),
  }

  return {
    mode: fixed.mode ?? 'text',
    setMode: fixed.setMode ?? vi.fn(),
    loading: false,
    text: { workflow: textWorkflow, viewState: textViewState },
    json: { workflow: jsonWorkflow, viewState: jsonViewState },
    directory: {
      state: {
        directoryLeftRoot: '',
        setDirectoryLeftRoot: vi.fn(),
        directoryRightRoot: '',
        setDirectoryRightRoot: vi.fn(),
        directoryNameFilter: '',
        setDirectoryNameFilter: vi.fn(),
        directoryCurrentPath: '',
        setDirectoryCurrentPath: vi.fn(),
        directoryResult: null,
        setDirectoryResult: vi.fn(),
        directoryStatus: '',
        setDirectoryStatus: vi.fn(),
      },
      viewState: directoryViewState,
      workflow: directoryWorkflow,
      childDiffActions: directoryChildDiffActions,
      interactions: directoryInteractions,
    },
  } as unknown as ShellArgs
}

function makeBlock(overrides: Partial<TextChangeBlock> = {}): TextChangeBlock {
  return {
    id: 'block-1',
    startItemIndex: 0,
    endItemIndex: 1,
    oldRangeStart: 1,
    oldRangeCount: 1,
    newRangeStart: 1,
    newRangeCount: 1,
    oldContent: ['line A'],
    newContent: ['line B'],
    ...overrides,
  }
}

type MainElement = ReactElement<{
  textResultProps: {
    onAdoptBlock: (block: TextChangeBlock, direction: 'to-old' | 'to-new') => void
    onUndoAdopt: () => void
    onRedoAdopt: () => void
    canUndoAdopt: boolean
    canRedoAdopt: boolean
  }
  textSourceProps: {
    onSwitchToJSON: (oldText: string, newText: string) => void
  }
}>

function getMain(model: ReturnType<typeof useDesktopShellModel>): MainElement {
  return model.main as MainElement
}

type RenderShellArgs = {
  textOld: string
  textNew: string
}

function renderShell(
  initialTextOld: string,
  initialTextNew: string,
  fixed: FixedShellInputs = {},
) {
  return renderHook(
    ({ textOld, textNew }: RenderShellArgs) =>
      useDesktopShellModel(makeShellArgs(textOld, textNew, fixed)),
    {
      initialProps: { textOld: initialTextOld, textNew: initialTextNew },
    },
  )
}

describe('useDesktopShellModel', () => {
  describe('text adopt undo/redo', () => {
    it('starts clean: undo/redo stacks empty, isDirty=false', () => {
      const { result } = renderShell('', '')
      expect(result.current.isDirty).toBe(false)
      expect(getMain(result.current).props.textResultProps.canUndoAdopt).toBe(false)
      expect(getMain(result.current).props.textResultProps.canRedoAdopt).toBe(false)
    })

    it('adopt to-old pushes undo, marks dirty, calls setTextOld + runTextDiffWithValues', async () => {
      const setTextOld = vi.fn()
      const setTextNew = vi.fn()
      const runTextDiffWithValues = vi.fn().mockResolvedValue(undefined)

      const { result } = renderShell('line A\n', 'line B\n', {
        textOldSourcePath: '/old.txt',
        textNewSourcePath: '/new.txt',
        setTextOld,
        setTextNew,
        runTextDiffWithValues,
      })

      await act(async () => {
        getMain(result.current).props.textResultProps.onAdoptBlock(makeBlock(), 'to-old')
      })

      expect(result.current.isDirty).toBe(true)
      expect(getMain(result.current).props.textResultProps.canUndoAdopt).toBe(true)
      expect(getMain(result.current).props.textResultProps.canRedoAdopt).toBe(false)
      expect(setTextOld).toHaveBeenCalledWith('line B\n')
      expect(setTextNew).toHaveBeenCalledWith('line B\n')
      expect(runTextDiffWithValues).toHaveBeenCalledWith({
        oldText: 'line B\n',
        newText: 'line B\n',
        oldSourcePath: '/old.txt',
        newSourcePath: '/new.txt',
      })
    })

    it('adopt no-op: when block changes nothing, stack stays empty', () => {
      const setTextOld = vi.fn()
      const setTextNew = vi.fn()

      const { result } = renderShell('same\n', 'same\n', {
        setTextOld,
        setTextNew,
      })

      act(() => {
        getMain(result.current).props.textResultProps.onAdoptBlock(
          makeBlock({ oldContent: ['same'], newContent: ['same'] }),
          'to-old',
        )
      })

      expect(result.current.isDirty).toBe(false)
      expect(setTextOld).not.toHaveBeenCalled()
      expect(setTextNew).not.toHaveBeenCalled()
    })

    it('undo restores prior text, drains undo, populates redo', async () => {
      const setTextOld = vi.fn()
      const setTextNew = vi.fn()
      const runTextDiffWithValues = vi.fn().mockResolvedValue(undefined)

      const { result, rerender } = renderShell('line A\n', 'line B\n', {
        setTextOld,
        setTextNew,
        runTextDiffWithValues,
      })

      await act(async () => {
        getMain(result.current).props.textResultProps.onAdoptBlock(makeBlock(), 'to-old')
      })

      // Mirror the post-adopt textWorkflow state for the next render cycle.
      rerender({ textOld: 'line B\n', textNew: 'line B\n' })

      setTextOld.mockClear()
      setTextNew.mockClear()
      runTextDiffWithValues.mockClear()

      await act(async () => {
        getMain(result.current).props.textResultProps.onUndoAdopt()
      })

      expect(setTextOld).toHaveBeenCalledWith('line A\n')
      expect(setTextNew).toHaveBeenCalledWith('line B\n')
      expect(runTextDiffWithValues).toHaveBeenCalledWith(
        expect.objectContaining({ oldText: 'line A\n', newText: 'line B\n' }),
      )

      expect(getMain(result.current).props.textResultProps.canUndoAdopt).toBe(false)
      expect(getMain(result.current).props.textResultProps.canRedoAdopt).toBe(true)
      expect(result.current.isDirty).toBe(false)
    })

    it('redo re-applies the change, drains redo, repopulates undo', async () => {
      const setTextOld = vi.fn()
      const setTextNew = vi.fn()
      const runTextDiffWithValues = vi.fn().mockResolvedValue(undefined)

      const { result, rerender } = renderShell('line A\n', 'line B\n', {
        setTextOld,
        setTextNew,
        runTextDiffWithValues,
      })

      await act(async () => {
        getMain(result.current).props.textResultProps.onAdoptBlock(makeBlock(), 'to-old')
      })
      rerender({ textOld: 'line B\n', textNew: 'line B\n' })

      await act(async () => {
        getMain(result.current).props.textResultProps.onUndoAdopt()
      })
      rerender({ textOld: 'line A\n', textNew: 'line B\n' })

      setTextOld.mockClear()
      setTextNew.mockClear()
      runTextDiffWithValues.mockClear()

      await act(async () => {
        getMain(result.current).props.textResultProps.onRedoAdopt()
      })

      expect(setTextOld).toHaveBeenCalledWith('line B\n')
      expect(setTextNew).toHaveBeenCalledWith('line B\n')
      expect(runTextDiffWithValues).toHaveBeenCalledWith(
        expect.objectContaining({ oldText: 'line B\n', newText: 'line B\n' }),
      )
      expect(getMain(result.current).props.textResultProps.canUndoAdopt).toBe(true)
      expect(getMain(result.current).props.textResultProps.canRedoAdopt).toBe(false)
      expect(result.current.isDirty).toBe(true)
    })

    it('new adopt clears redo stack', async () => {
      const { result, rerender } = renderShell('line A\n', 'line B\n')

      await act(async () => {
        getMain(result.current).props.textResultProps.onAdoptBlock(makeBlock(), 'to-old')
      })
      rerender({ textOld: 'line B\n', textNew: 'line B\n' })

      await act(async () => {
        getMain(result.current).props.textResultProps.onUndoAdopt()
      })
      rerender({ textOld: 'line A\n', textNew: 'line B\n' })

      expect(getMain(result.current).props.textResultProps.canRedoAdopt).toBe(true)

      await act(async () => {
        getMain(result.current).props.textResultProps.onAdoptBlock(makeBlock(), 'to-old')
      })

      expect(getMain(result.current).props.textResultProps.canUndoAdopt).toBe(true)
      expect(getMain(result.current).props.textResultProps.canRedoAdopt).toBe(false)
    })
  })

  describe('text → JSON switch', () => {
    it('copies texts and sets mode to json', () => {
      const setMode = vi.fn()
      const setJSONOldInput = vi.fn()
      const setJSONNewInput = vi.fn()

      const { result } = renderShell('', '', {
        setMode,
        setJSONOldInput,
        setJSONNewInput,
      })

      act(() => {
        getMain(result.current).props.textSourceProps.onSwitchToJSON(
          '{"a":1}',
          '{"a":2}',
        )
      })

      expect(setJSONOldInput).toHaveBeenCalledWith('{"a":1}')
      expect(setJSONNewInput).toHaveBeenCalledWith('{"a":2}')
      expect(setMode).toHaveBeenCalledWith('json')
    })
  })

  describe('layoutMode', () => {
    it('returns workspace for text mode', () => {
      const { result } = renderShell('', '', { mode: 'text' })
      expect(result.current.layoutMode).toBe('workspace')
    })

    it('returns workspace for json mode', () => {
      const { result } = renderShell('', '', { mode: 'json' })
      expect(result.current.layoutMode).toBe('workspace')
    })

    it('returns workspace for directory mode', () => {
      const { result } = renderShell('', '', { mode: 'directory' })
      expect(result.current.layoutMode).toBe('workspace')
    })
  })
})

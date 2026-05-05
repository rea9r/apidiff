import { render, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DesktopState, DiffCommon } from '../types'
import { CodeFontScaleProvider } from '../useCodeFontScale'
import { AISetupProvider } from '../features/ai/AISetupProvider'
import { App } from '../App'

const baseCommon: DiffCommon = {
  outputFormat: 'text',
  textStyle: 'auto',
  ignorePaths: [],
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreEOL: false,
}

function makeInitialState(lastUsedMode: 'text' | 'json' | 'directory'): DesktopState {
  return {
    version: 3,
    tabs: [
      {
        id: 'tab-1',
        label: 'Tab 1',
        lastUsedMode,
        json: {
          oldSourcePath: '',
          newSourcePath: '',
          ignoreOrder: false,
          common: { ...baseCommon },
        },
        text: {
          oldSourcePath: '',
          newSourcePath: '',
          common: { ...baseCommon },
          diffLayout: 'split',
        },
        directory: {
          leftRoot: '',
          rightRoot: '',
          currentPath: '',
          viewMode: 'list',
        },
      },
    ],
    activeTabId: 'tab-1',
    jsonRecentPairs: [],
    textRecentPairs: [],
    directoryRecentPairs: [],
  }
}

const diffText = vi.fn()
const loadDesktopState = vi.fn()
const saveDesktopState = vi.fn().mockResolvedValue(undefined)
const aiSetupProgress = vi.fn().mockResolvedValue({ phase: 'idle' })
const aiProviderStatus = vi
  .fn()
  .mockResolvedValue({
    available: false,
    ollamaInstalled: false,
    ollamaReachable: false,
    canAutoStart: false,
  })

const bridgeFake = {
  diffText,
  diffJSONValuesRich: vi.fn(),
  diffDirectories: vi.fn(),
  pickJSONFile: vi.fn().mockResolvedValue(''),
  pickTextFile: vi.fn().mockResolvedValue(''),
  pickSaveTextFile: vi.fn().mockResolvedValue(''),
  pickDirectoryRoot: vi.fn().mockResolvedValue(''),
  loadTextFile: vi.fn(),
  saveTextFile: vi.fn(),
  loadDesktopState,
  saveDesktopState,
  aiProviderStatus,
  buildDirectorySummaryContext: vi.fn(),
  explainDiff: vi.fn(),
  explainDiffStream: vi.fn(),
  startAISetup: vi.fn().mockResolvedValue(undefined),
  aiSetupProgress,
  cancelAISetup: vi.fn().mockResolvedValue(undefined),
  deleteOllamaModel: vi.fn().mockResolvedValue(undefined),
  openOllamaDownloadPage: vi.fn().mockResolvedValue(undefined),
}

vi.mock('../useDesktopBridge', () => ({
  useDesktopBridge: () => bridgeFake,
}))

function renderApp(): ReturnType<typeof render> {
  return render(
    <MantineProvider defaultColorScheme="light">
      <Notifications position="bottom-right" />
      <CodeFontScaleProvider>
        <AISetupProvider>
          <App />
        </AISetupProvider>
      </CodeFontScaleProvider>
    </MantineProvider>,
  )
}

describe('App shell — text diff golden path', () => {
  beforeEach(() => {
    // Prefer text mode on first paint so the Compare button isn't gated by
    // empty JSON input validation. The mode-state hook reads this on init.
    window.localStorage.setItem('xdiff.desktop.lastUsedMode', 'text')

    diffText.mockReset()
    loadDesktopState.mockReset()
    loadDesktopState.mockResolvedValue(makeInitialState('text'))
    // Never resolve: we only verify the bridge was invoked on click. Letting
    // the diff result render kicks off heavy line-by-line rendering that
    // jsdom struggles with, and that path is not what this test covers.
    diffText.mockImplementation(() => new Promise(() => {}))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('hydrates the shell and shows the Compare action', async () => {
    renderApp()

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /compare/i }) as HTMLButtonElement
      expect(btn).toBeInTheDocument()
      expect(btn.disabled).toBe(false)
    })
  })

  it('calls DiffText when Compare is pressed', async () => {
    renderApp()

    const compareButton = await waitFor(() => {
      const btn = screen.getByRole('button', { name: /compare/i }) as HTMLButtonElement
      expect(btn.disabled).toBe(false)
      return btn
    })
    // Native .click() instead of fireEvent.click — fireEvent's act() wrapper
    // hangs in this setup due to the heavy provider tree.
    compareButton.click()

    await waitFor(() => {
      expect(diffText).toHaveBeenCalledTimes(1)
    })
  })

})

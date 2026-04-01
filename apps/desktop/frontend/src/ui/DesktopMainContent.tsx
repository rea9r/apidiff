import type { ComponentProps } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import type { Mode } from '../types'
import { CompareWorkspaceShell } from './CompareWorkspaceShell'
import { DirectoryCompareResultPanel } from '../features/folder/DirectoryCompareResultPanel'
import { TextCompareResultPanel } from '../features/text/TextCompareResultPanel'
import { TextCompareSourceWorkspace } from '../features/text/TextCompareSourceWorkspace'
import { JSONCompareResultPanel } from '../features/json/JSONCompareResultPanel'
import { JSONCompareSourceWorkspace } from '../features/json/JSONCompareSourceWorkspace'
import { SpecCompareResultPanel } from '../features/spec/SpecCompareResultPanel'
import { SpecCompareSourceWorkspace } from '../features/spec/SpecCompareSourceWorkspace'
import { ScenarioResultPanel } from '../features/scenario/ScenarioResultPanel'

type TextSourceWorkspaceProps = ComponentProps<typeof TextCompareSourceWorkspace>
type TextResultPanelProps = ComponentProps<typeof TextCompareResultPanel>
type JSONSourceWorkspaceProps = ComponentProps<typeof JSONCompareSourceWorkspace>
type JSONResultPanelProps = ComponentProps<typeof JSONCompareResultPanel>
type SpecSourceWorkspaceProps = ComponentProps<typeof SpecCompareSourceWorkspace>
type SpecResultPanelProps = ComponentProps<typeof SpecCompareResultPanel>
type DirectoryResultPanelProps = ComponentProps<typeof DirectoryCompareResultPanel>
type ScenarioResultPanelProps = ComponentProps<typeof ScenarioResultPanel>

type DesktopMainContentProps = {
  mode: Mode
  showFolderReturnBanner: boolean
  onReturnToFolderCompare: () => void
  textSourceProps: TextSourceWorkspaceProps
  textResultProps: TextResultPanelProps
  jsonSourceProps: JSONSourceWorkspaceProps
  jsonResultProps: JSONResultPanelProps
  specSourceProps: SpecSourceWorkspaceProps
  specResultProps: SpecResultPanelProps
  folderResultProps: DirectoryResultPanelProps
  scenarioResultProps: ScenarioResultPanelProps
}

export function DesktopMainContent({
  mode,
  showFolderReturnBanner,
  onReturnToFolderCompare,
  textSourceProps,
  textResultProps,
  jsonSourceProps,
  jsonResultProps,
  specSourceProps,
  specResultProps,
  folderResultProps,
  scenarioResultProps,
}: DesktopMainContentProps) {
  const folderReturnPathBanner = showFolderReturnBanner ? (
    <div className="folder-return-banner">
      <button
        type="button"
        className="button-secondary button-compact folder-return-button"
        onClick={onReturnToFolderCompare}
      >
        <IconArrowLeft size={13} />
        Back to directory compare
      </button>
    </div>
  ) : null

  if (mode === 'text') {
    return (
      <div className="compare-main-shell">
        {folderReturnPathBanner}
        <CompareWorkspaceShell
          source={<TextCompareSourceWorkspace {...textSourceProps} />}
          result={<TextCompareResultPanel {...textResultProps} />}
        />
      </div>
    )
  }

  if (mode === 'json') {
    return (
      <div className="compare-main-shell">
        {folderReturnPathBanner}
        <CompareWorkspaceShell
          source={<JSONCompareSourceWorkspace {...jsonSourceProps} />}
          result={<JSONCompareResultPanel {...jsonResultProps} />}
        />
      </div>
    )
  }

  if (mode === 'spec') {
    return (
      <div className="compare-main-shell">
        {folderReturnPathBanner}
        <CompareWorkspaceShell
          source={<SpecCompareSourceWorkspace {...specSourceProps} />}
          result={<SpecCompareResultPanel {...specResultProps} />}
        />
      </div>
    )
  }

  if (mode === 'folder') {
    return (
      <div className="result-panel">
        <DirectoryCompareResultPanel {...folderResultProps} />
      </div>
    )
  }

  return (
    <div className="result-panel">
      <h2>Result</h2>
      <ScenarioResultPanel {...scenarioResultProps} />
    </div>
  )
}

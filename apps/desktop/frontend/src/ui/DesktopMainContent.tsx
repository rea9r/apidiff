import { lazy, Suspense } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import type { Mode } from '../types'
import { CompareWorkspaceShell } from './CompareWorkspaceShell'
import type { DirectoryCompareResultPanelProps } from '../features/directory/DirectoryCompareResultPanel'
import type { TextCompareResultPanelProps } from '../features/text/TextCompareResultPanel'
import type { TextCompareSourceWorkspaceProps } from '../features/text/TextCompareSourceWorkspace'
import type { JSONCompareResultPanelProps } from '../features/json/JSONCompareResultPanel'
import type { JSONCompareSourceWorkspaceProps } from '../features/json/JSONCompareSourceWorkspace'

const DirectoryCompareResultPanel = lazy(() =>
  import('../features/directory/DirectoryCompareResultPanel').then((module) => ({
    default: module.DirectoryCompareResultPanel,
  })),
)
const TextCompareResultPanel = lazy(() =>
  import('../features/text/TextCompareResultPanel').then((module) => ({
    default: module.TextCompareResultPanel,
  })),
)
const TextCompareSourceWorkspace = lazy(() =>
  import('../features/text/TextCompareSourceWorkspace').then((module) => ({
    default: module.TextCompareSourceWorkspace,
  })),
)
const JSONCompareResultPanel = lazy(() =>
  import('../features/json/JSONCompareResultPanel').then((module) => ({
    default: module.JSONCompareResultPanel,
  })),
)
const JSONCompareSourceWorkspace = lazy(() =>
  import('../features/json/JSONCompareSourceWorkspace').then((module) => ({
    default: module.JSONCompareSourceWorkspace,
  })),
)

function MainContentLoadingFallback() {
  return <div className="muted">Loading view...</div>
}

type DesktopMainContentProps = {
  mode: Mode
  showDirectoryReturnBanner: boolean
  onReturnToDirectoryCompare: () => void
  textSourceProps: TextCompareSourceWorkspaceProps
  textResultProps: TextCompareResultPanelProps
  jsonSourceProps: JSONCompareSourceWorkspaceProps
  jsonResultProps: JSONCompareResultPanelProps
  directoryResultProps: DirectoryCompareResultPanelProps
}

export function DesktopMainContent({
  mode,
  showDirectoryReturnBanner,
  onReturnToDirectoryCompare,
  textSourceProps,
  textResultProps,
  jsonSourceProps,
  jsonResultProps,
  directoryResultProps,
}: DesktopMainContentProps) {
  const directoryReturnPathBanner = showDirectoryReturnBanner ? (
    <div className="directory-return-banner">
      <button
        type="button"
        className="button-secondary button-compact directory-return-button"
        onClick={onReturnToDirectoryCompare}
      >
        <IconArrowLeft size={13} />
        Back to directory compare
      </button>
    </div>
  ) : null

  if (mode === 'text') {
    return (
      <div className="compare-main-shell">
        {directoryReturnPathBanner}
        <Suspense fallback={<MainContentLoadingFallback />}>
          <CompareWorkspaceShell
            source={<TextCompareSourceWorkspace {...textSourceProps} />}
            result={<TextCompareResultPanel {...textResultProps} />}
          />
        </Suspense>
      </div>
    )
  }

  if (mode === 'json') {
    return (
      <div className="compare-main-shell">
        {directoryReturnPathBanner}
        <Suspense fallback={<MainContentLoadingFallback />}>
          <CompareWorkspaceShell
            source={<JSONCompareSourceWorkspace {...jsonSourceProps} />}
            result={<JSONCompareResultPanel {...jsonResultProps} />}
          />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="result-panel">
      <Suspense fallback={<MainContentLoadingFallback />}>
        <DirectoryCompareResultPanel {...directoryResultProps} />
      </Suspense>
    </div>
  )
}

import { useCallback, useState } from 'react'
import type { DirectoryCompareItem, Mode } from '../../types'
import { formatUnknownError } from '../../utils/appHelpers'
import { canOpenDirectoryItem, type DirectoryViewMode } from './directoryTree'

type DirectoryReturnContext = {
  leftRoot: string
  rightRoot: string
  currentPath: string
  selectedPath: string
  viewMode: DirectoryViewMode
}

type UseDirectoryCompareChildDiffActionsOptions = {
  directoryLeftRoot: string
  directoryRightRoot: string
  directoryCurrentPath: string
  directoryViewMode: DirectoryViewMode
  setDirectoryLeftRoot: (value: string) => void
  setDirectoryRightRoot: (value: string) => void
  setDirectoryCurrentPath: (value: string) => void
  setSelectedDirectoryItemPath: (value: string) => void
  setDirectoryViewMode: (value: DirectoryViewMode) => void
  setDirectoryStatus: (value: string) => void
  setMode: (value: Mode) => void
  onOpenJSONDiff: (entry: DirectoryCompareItem) => Promise<void>
  onOpenTextDiff: (entry: DirectoryCompareItem) => Promise<void>
  onOpenChildDiffError?: (message: string) => void
}

export function useDirectoryCompareChildDiffActions({
  directoryLeftRoot,
  directoryRightRoot,
  directoryCurrentPath,
  directoryViewMode,
  setDirectoryLeftRoot,
  setDirectoryRightRoot,
  setDirectoryCurrentPath,
  setSelectedDirectoryItemPath,
  setDirectoryViewMode,
  setDirectoryStatus,
  setMode,
  onOpenJSONDiff,
  onOpenTextDiff,
  onOpenChildDiffError,
}: UseDirectoryCompareChildDiffActionsOptions) {
  const [directoryOpenBusyPath, setDirectoryOpenBusyPath] = useState('')
  const [directoryReturnContext, setDirectoryReturnContext] =
    useState<DirectoryReturnContext | null>(null)

  const openDirectoryEntryDiff = useCallback(
    async (entry: DirectoryCompareItem) => {
      if (!canOpenDirectoryItem(entry)) {
        return
      }

      setDirectoryReturnContext({
        leftRoot: directoryLeftRoot,
        rightRoot: directoryRightRoot,
        currentPath: directoryCurrentPath,
        selectedPath: entry.relativePath,
        viewMode: directoryViewMode,
      })
      setDirectoryOpenBusyPath(entry.relativePath)
      setDirectoryStatus('')

      try {
        if (entry.compareModeHint === 'json') {
          await onOpenJSONDiff(entry)
          return
        }

        await onOpenTextDiff(entry)
      } catch (error) {
        const message = `Failed to open diff: ${formatUnknownError(error)}`
        setDirectoryStatus(message)
        onOpenChildDiffError?.(message)
      } finally {
        setDirectoryOpenBusyPath('')
      }
    },
    [
      directoryCurrentPath,
      directoryLeftRoot,
      directoryRightRoot,
      directoryViewMode,
      onOpenChildDiffError,
      onOpenJSONDiff,
      onOpenTextDiff,
      setDirectoryStatus,
    ],
  )

  const returnToDirectoryCompare = useCallback(() => {
    if (directoryReturnContext) {
      setDirectoryLeftRoot(directoryReturnContext.leftRoot)
      setDirectoryRightRoot(directoryReturnContext.rightRoot)
      setDirectoryCurrentPath(directoryReturnContext.currentPath)
      setSelectedDirectoryItemPath(directoryReturnContext.selectedPath)
      setDirectoryViewMode(directoryReturnContext.viewMode)
    }
    setMode('directory')
  }, [
    directoryReturnContext,
    setDirectoryCurrentPath,
    setDirectoryLeftRoot,
    setDirectoryRightRoot,
    setDirectoryViewMode,
    setMode,
    setSelectedDirectoryItemPath,
  ])

  return {
    directoryOpenBusyPath,
    directoryReturnContext,
    openDirectoryEntryDiff,
    returnToDirectoryCompare,
  }
}

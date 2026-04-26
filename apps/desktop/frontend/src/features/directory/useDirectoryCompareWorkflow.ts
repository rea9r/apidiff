import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react'
import type {
  CompareDirectoriesRequest,
  CompareDirectoriesResponse,
  DesktopRecentDirectoryPair,
} from '../../types'
import { upsertRecentDirectoryPair } from '../../persistence'
import { formatUnknownError } from '../../utils/appHelpers'
import type { DirectoryViewMode } from './directoryTree'

type UseDirectoryCompareWorkflowOptions = {
  isDirectoryMode: boolean
  directoryLeftRoot: string
  directoryRightRoot: string
  directoryNameFilter: string
  directoryCurrentPath: string
  directoryResult: CompareDirectoriesResponse | null
  directoryViewMode: DirectoryViewMode
  pickDirectoryRoot?: () => Promise<string>
  compareDirectories?: (req: CompareDirectoriesRequest) => Promise<CompareDirectoriesResponse>
  setDirectoryLeftRoot: (value: string) => void
  setDirectoryRightRoot: (value: string) => void
  setDirectoryCurrentPath: (value: string) => void
  setDirectoryResult: (value: CompareDirectoriesResponse | null) => void
  setDirectoryStatus: (value: string) => void
  setDirectoryRecentPairs: Dispatch<SetStateAction<DesktopRecentDirectoryPair[]>>
  setSelectedDirectoryItemPath: (value: string) => void
  onDirectoryPickerUnavailable?: () => void
  onDirectoryPickerError?: (message: string) => void
}

export function useDirectoryCompareWorkflow({
  isDirectoryMode,
  directoryLeftRoot,
  directoryRightRoot,
  directoryNameFilter,
  directoryCurrentPath,
  directoryResult,
  directoryViewMode,
  pickDirectoryRoot,
  compareDirectories,
  setDirectoryLeftRoot,
  setDirectoryRightRoot,
  setDirectoryCurrentPath,
  setDirectoryResult,
  setDirectoryStatus,
  setDirectoryRecentPairs,
  setSelectedDirectoryItemPath,
  onDirectoryPickerUnavailable,
  onDirectoryPickerError,
}: UseDirectoryCompareWorkflowOptions) {
  const nowISO = () => new Date().toISOString()

  const runDirectoryCompare = useCallback(
    async (nextCurrentPath = directoryCurrentPath) => {
      if (!compareDirectories) {
        throw new Error('Wails bridge not available (CompareDirectories)')
      }

      setDirectoryStatus('')

      const res: CompareDirectoriesResponse = await compareDirectories({
        leftRoot: directoryLeftRoot,
        rightRoot: directoryRightRoot,
        currentPath: nextCurrentPath,
        recursive: true,
        showSame: true,
        nameFilter: directoryNameFilter,
      } satisfies CompareDirectoriesRequest)

      setDirectoryResult(res)
      setDirectoryCurrentPath(res.currentPath ?? nextCurrentPath)

      if (res.error) {
        setDirectoryStatus(res.error)
        return
      }

      setDirectoryStatus('')
      setDirectoryRecentPairs((prev) =>
        upsertRecentDirectoryPair(prev, {
          leftRoot: directoryLeftRoot,
          rightRoot: directoryRightRoot,
          currentPath: res.currentPath ?? nextCurrentPath,
          viewMode: directoryViewMode,
          usedAt: nowISO(),
        }),
      )
    },
    [
      compareDirectories,
      directoryCurrentPath,
      directoryLeftRoot,
      directoryNameFilter,
      directoryRightRoot,
      directoryViewMode,
      setDirectoryCurrentPath,
      setDirectoryRecentPairs,
      setDirectoryResult,
      setDirectoryStatus,
    ],
  )

  useEffect(() => {
    if (!isDirectoryMode) {
      return
    }
    if (!directoryResult) {
      return
    }
    if (!directoryLeftRoot || !directoryRightRoot) {
      return
    }

    const resultPath = directoryResult.currentPath ?? ''
    if (resultPath === directoryCurrentPath) {
      return
    }

    void runDirectoryCompare(directoryCurrentPath)
  }, [
    directoryCurrentPath,
    directoryLeftRoot,
    directoryResult,
    directoryRightRoot,
    isDirectoryMode,
    runDirectoryCompare,
  ])

  const setDirectoryRootPath = useCallback(
    (target: 'left' | 'right', path: string) => {
      if (target === 'left') {
        setDirectoryLeftRoot(path)
      } else {
        setDirectoryRightRoot(path)
      }

      setDirectoryCurrentPath('')
      setSelectedDirectoryItemPath('')
      setDirectoryResult(null)
      setDirectoryStatus('')
    },
    [
      setDirectoryCurrentPath,
      setDirectoryLeftRoot,
      setDirectoryResult,
      setDirectoryRightRoot,
      setDirectoryStatus,
      setSelectedDirectoryItemPath,
    ],
  )

  const browseDirectoryRoot = useCallback(
    async (target: 'left' | 'right') => {
      if (!pickDirectoryRoot) {
        setDirectoryStatus('Directory picker is not available.')
        onDirectoryPickerUnavailable?.()
        return
      }

      try {
        const selected = await pickDirectoryRoot()
        if (!selected) {
          return
        }

        setDirectoryRootPath(target, selected)
      } catch (error) {
        const message = `Failed to pick directory: ${formatUnknownError(error)}`
        setDirectoryStatus(message)
        onDirectoryPickerError?.(message)
      }
    },
    [
      onDirectoryPickerError,
      onDirectoryPickerUnavailable,
      pickDirectoryRoot,
      setDirectoryRootPath,
      setDirectoryStatus,
    ],
  )

  return {
    browseDirectoryRoot,
    setDirectoryRootPath,
    runDirectoryCompare,
  }
}

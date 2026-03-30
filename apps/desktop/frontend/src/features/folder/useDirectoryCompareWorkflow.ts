import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react'
import type {
  CompareFoldersRequest,
  CompareFoldersResponse,
  DesktopRecentFolderPair,
} from '../../types'
import { upsertRecentFolderPair } from '../../persistence'
import { formatUnknownError } from '../../utils/appHelpers'
import type { FolderViewMode } from './folderTree'

type UseDirectoryCompareWorkflowOptions = {
  isFolderMode: boolean
  folderLeftRoot: string
  folderRightRoot: string
  folderNameFilter: string
  folderCurrentPath: string
  folderResult: CompareFoldersResponse | null
  folderViewMode: FolderViewMode
  pickFolderRoot?: () => Promise<string>
  compareFolders?: (req: CompareFoldersRequest) => Promise<CompareFoldersResponse>
  setFolderLeftRoot: (value: string) => void
  setFolderRightRoot: (value: string) => void
  setFolderCurrentPath: (value: string) => void
  setFolderResult: (value: CompareFoldersResponse | null) => void
  setFolderStatus: (value: string) => void
  setFolderRecentPairs: Dispatch<SetStateAction<DesktopRecentFolderPair[]>>
  setSelectedFolderItemPath: (value: string) => void
  onDirectoryPickerUnavailable?: () => void
  onDirectoryPickerError?: (message: string) => void
}

export function useDirectoryCompareWorkflow({
  isFolderMode,
  folderLeftRoot,
  folderRightRoot,
  folderNameFilter,
  folderCurrentPath,
  folderResult,
  folderViewMode,
  pickFolderRoot,
  compareFolders,
  setFolderLeftRoot,
  setFolderRightRoot,
  setFolderCurrentPath,
  setFolderResult,
  setFolderStatus,
  setFolderRecentPairs,
  setSelectedFolderItemPath,
  onDirectoryPickerUnavailable,
  onDirectoryPickerError,
}: UseDirectoryCompareWorkflowOptions) {
  const nowISO = () => new Date().toISOString()

  const runFolderCompare = useCallback(
    async (nextCurrentPath = folderCurrentPath) => {
      if (!compareFolders) {
        throw new Error('Wails bridge not available (CompareFolders)')
      }

      setFolderStatus('')

      const res: CompareFoldersResponse = await compareFolders({
        leftRoot: folderLeftRoot,
        rightRoot: folderRightRoot,
        currentPath: nextCurrentPath,
        recursive: true,
        showSame: true,
        nameFilter: folderNameFilter,
      } satisfies CompareFoldersRequest)

      setFolderResult(res)
      setFolderCurrentPath(res.currentPath ?? nextCurrentPath)

      if (res.error) {
        setFolderStatus(res.error)
        return
      }

      setFolderStatus('')
      setFolderRecentPairs((prev) =>
        upsertRecentFolderPair(prev, {
          leftRoot: folderLeftRoot,
          rightRoot: folderRightRoot,
          currentPath: res.currentPath ?? nextCurrentPath,
          viewMode: folderViewMode,
          usedAt: nowISO(),
        }),
      )
    },
    [
      compareFolders,
      folderCurrentPath,
      folderLeftRoot,
      folderNameFilter,
      folderRightRoot,
      folderViewMode,
      setFolderCurrentPath,
      setFolderRecentPairs,
      setFolderResult,
      setFolderStatus,
    ],
  )

  useEffect(() => {
    if (!isFolderMode) {
      return
    }
    if (!folderResult) {
      return
    }
    if (!folderLeftRoot || !folderRightRoot) {
      return
    }

    const resultPath = folderResult.currentPath ?? ''
    if (resultPath === folderCurrentPath) {
      return
    }

    void runFolderCompare(folderCurrentPath)
  }, [
    folderCurrentPath,
    folderLeftRoot,
    folderResult,
    folderRightRoot,
    isFolderMode,
    runFolderCompare,
  ])

  const browseFolderRoot = useCallback(
    async (target: 'left' | 'right') => {
      if (!pickFolderRoot) {
        setFolderStatus('Directory picker is not available.')
        onDirectoryPickerUnavailable?.()
        return
      }

      try {
        const selected = await pickFolderRoot()
        if (!selected) {
          return
        }

        if (target === 'left') {
          setFolderLeftRoot(selected)
        } else {
          setFolderRightRoot(selected)
        }

        setFolderCurrentPath('')
        setSelectedFolderItemPath('')
        setFolderResult(null)
        setFolderStatus('')
      } catch (error) {
        const message = `Failed to pick directory: ${formatUnknownError(error)}`
        setFolderStatus(message)
        onDirectoryPickerError?.(message)
      }
    },
    [
      onDirectoryPickerError,
      onDirectoryPickerUnavailable,
      pickFolderRoot,
      setFolderCurrentPath,
      setFolderLeftRoot,
      setFolderResult,
      setFolderRightRoot,
      setFolderStatus,
      setSelectedFolderItemPath,
    ],
  )

  return {
    browseFolderRoot,
    runFolderCompare,
  }
}

import { useCallback, type Dispatch, type KeyboardEvent as ReactKeyboardEvent, type SetStateAction } from 'react'
import type {
  CompareFoldersRequest,
  CompareFoldersResponse,
  DesktopRecentFolderPair,
  FolderCompareItem,
  Mode,
} from '../../types'
import { upsertRecentFolderPair } from '../../persistence'
import { canOpenFolderItem, type FolderTreeNode, type FolderViewMode } from './folderTree'

type UseDirectoryCompareInteractionsOptions = {
  compareFolders?: (req: CompareFoldersRequest) => Promise<CompareFoldersResponse>
  folderNameFilter: string
  folderResult: CompareFoldersResponse | null
  sortedFolderItems: FolderCompareItem[]
  selectedFolderItem: FolderCompareItem | null
  resetFolderNavigationState: () => void
  openFolderEntryDiff: (item: FolderCompareItem) => Promise<void>
  toggleFolderTreeNode: (node: FolderTreeNode) => Promise<void>
  setFolderLeftRoot: (value: string) => void
  setFolderRightRoot: (value: string) => void
  setFolderCurrentPath: (value: string) => void
  setFolderViewMode: (value: FolderViewMode) => void
  setSelectedFolderItemPath: (value: string) => void
  setFolderResult: (value: CompareFoldersResponse | null) => void
  setFolderStatus: (value: string) => void
  setFolderRecentPairs: Dispatch<SetStateAction<DesktopRecentFolderPair[]>>
  setMode: (value: Mode) => void
}

export function useDirectoryCompareInteractions({
  compareFolders,
  folderNameFilter,
  folderResult,
  sortedFolderItems,
  selectedFolderItem,
  resetFolderNavigationState,
  openFolderEntryDiff,
  toggleFolderTreeNode,
  setFolderLeftRoot,
  setFolderRightRoot,
  setFolderCurrentPath,
  setFolderViewMode,
  setSelectedFolderItemPath,
  setFolderResult,
  setFolderStatus,
  setFolderRecentPairs,
  setMode,
}: UseDirectoryCompareInteractionsOptions) {
  const nowISO = () => new Date().toISOString()

  const navigateFolderPath = useCallback(
    (nextPath: string) => {
      resetFolderNavigationState()
      setFolderCurrentPath(nextPath)
    },
    [resetFolderNavigationState, setFolderCurrentPath],
  )

  const handleFolderRowDoubleClick = useCallback(
    async (item: FolderCompareItem) => {
      const enterable = item.isDir && item.status !== 'type-mismatch'
      if (enterable) {
        navigateFolderPath(item.relativePath)
        return
      }

      if (canOpenFolderItem(item)) {
        await openFolderEntryDiff(item)
      }
    },
    [navigateFolderPath, openFolderEntryDiff],
  )

  const handleFolderTreeRowDoubleClick = useCallback(
    async (node: FolderTreeNode) => {
      if (node.isDir && node.item.status !== 'type-mismatch') {
        await toggleFolderTreeNode(node)
        return
      }
      if (canOpenFolderItem(node.item)) {
        await openFolderEntryDiff(node.item)
      }
    },
    [openFolderEntryDiff, toggleFolderTreeNode],
  )

  const handleFolderTableKeyDown = useCallback(
    async (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }
      const tagName = target.tagName.toLowerCase()
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable
      ) {
        return
      }

      if (sortedFolderItems.length === 0) {
        return
      }

      const currentIndex = selectedFolderItem
        ? sortedFolderItems.findIndex((item) => item.relativePath === selectedFolderItem.relativePath)
        : -1

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, sortedFolderItems.length - 1)
        setSelectedFolderItemPath(sortedFolderItems[nextIndex].relativePath)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1
        setSelectedFolderItemPath(sortedFolderItems[nextIndex].relativePath)
        return
      }

      if (event.key === 'Enter' && selectedFolderItem) {
        event.preventDefault()
        await handleFolderRowDoubleClick(selectedFolderItem)
        return
      }

      if (event.key === 'Backspace' && folderResult?.currentPath) {
        event.preventDefault()
        navigateFolderPath(folderResult.parentPath || '')
      }
    },
    [
      folderResult,
      handleFolderRowDoubleClick,
      navigateFolderPath,
      selectedFolderItem,
      setSelectedFolderItemPath,
      sortedFolderItems,
    ],
  )

  const runFolderFromRecent = useCallback(
    async (entry: DesktopRecentFolderPair) => {
      if (!compareFolders) {
        throw new Error('Wails bridge not available (CompareFolders)')
      }

      const leftRoot = entry.leftRoot
      const rightRoot = entry.rightRoot
      const currentPath = entry.currentPath
      const viewMode = entry.viewMode

      const res: CompareFoldersResponse = await compareFolders({
        leftRoot,
        rightRoot,
        currentPath,
        recursive: true,
        showSame: true,
        nameFilter: folderNameFilter,
      } satisfies CompareFoldersRequest)

      setMode('folder')
      setFolderLeftRoot(leftRoot)
      setFolderRightRoot(rightRoot)
      setFolderCurrentPath(res.currentPath ?? currentPath)
      setFolderViewMode(viewMode === 'tree' ? 'tree' : 'list')
      setFolderResult(res)
      setFolderStatus(res.error ?? '')

      if (!res.error) {
        setFolderRecentPairs((prev) =>
          upsertRecentFolderPair(prev, {
            leftRoot,
            rightRoot,
            currentPath: res.currentPath ?? currentPath,
            viewMode: viewMode === 'tree' ? 'tree' : 'list',
            usedAt: nowISO(),
          }),
        )
      }
    },
    [
      compareFolders,
      folderNameFilter,
      setFolderCurrentPath,
      setFolderLeftRoot,
      setFolderRecentPairs,
      setFolderResult,
      setFolderRightRoot,
      setFolderStatus,
      setFolderViewMode,
      setMode,
    ],
  )

  return {
    navigateFolderPath,
    handleFolderRowDoubleClick,
    handleFolderTreeRowDoubleClick,
    handleFolderTableKeyDown,
    runFolderFromRecent,
  }
}

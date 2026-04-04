import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CompareFoldersRequest, CompareFoldersResponse, DesktopRecentFolderPair } from '../../../types'
import { useDirectoryCompareWorkflow } from '../useDirectoryCompareWorkflow'

function createResponse(currentPath: string): CompareFoldersResponse {
  return {
    currentPath,
    scannedSummary: {
      total: 1,
      same: 0,
      changed: 1,
      leftOnly: 0,
      rightOnly: 0,
      typeMismatch: 0,
      error: 0,
    },
    currentSummary: {
      total: 1,
      same: 0,
      changed: 1,
      leftOnly: 0,
      rightOnly: 0,
      typeMismatch: 0,
      error: 0,
    },
    items: [],
  }
}

describe('useDirectoryCompareWorkflow', () => {
  it('runFolderCompare updates result/currentPath and recent pair', async () => {
    const compareFolders = vi.fn(async (req: CompareFoldersRequest) => createResponse(req.currentPath))
    const setFolderRecentPairs = vi.fn()
    const setFolderResult = vi.fn()
    const setFolderCurrentPath = vi.fn()
    const setFolderStatus = vi.fn()

    const { result } = renderHook(() =>
      useDirectoryCompareWorkflow({
        isFolderMode: true,
        folderLeftRoot: '/left',
        folderRightRoot: '/right',
        folderNameFilter: '',
        folderCurrentPath: 'a/b',
        folderResult: null,
        folderViewMode: 'tree',
        compareFolders,
        setFolderLeftRoot: vi.fn(),
        setFolderRightRoot: vi.fn(),
        setFolderCurrentPath,
        setFolderResult,
        setFolderStatus,
        setFolderRecentPairs,
        setSelectedFolderItemPath: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.runFolderCompare('a/b')
    })

    expect(compareFolders).toHaveBeenCalledWith({
      leftRoot: '/left',
      rightRoot: '/right',
      currentPath: 'a/b',
      recursive: true,
      showSame: true,
      nameFilter: '',
    })
    expect(setFolderResult).toHaveBeenCalled()
    expect(setFolderCurrentPath).toHaveBeenCalledWith('a/b')
    expect(setFolderStatus).toHaveBeenCalledWith('')

    const updater = setFolderRecentPairs.mock.calls[0][0] as (prev: DesktopRecentFolderPair[]) => DesktopRecentFolderPair[]
    const updated = updater([])
    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      leftRoot: '/left',
      rightRoot: '/right',
      currentPath: 'a/b',
      viewMode: 'tree',
    })
  })

  it('browseFolderRoot resets state when directory selected', async () => {
    const setFolderLeftRoot = vi.fn()
    const setFolderCurrentPath = vi.fn()
    const setSelectedFolderItemPath = vi.fn()
    const setFolderResult = vi.fn()
    const setFolderStatus = vi.fn()

    const { result } = renderHook(() =>
      useDirectoryCompareWorkflow({
        isFolderMode: true,
        folderLeftRoot: '',
        folderRightRoot: '',
        folderNameFilter: '',
        folderCurrentPath: '',
        folderResult: null,
        folderViewMode: 'list',
        pickFolderRoot: async () => '/picked',
        setFolderLeftRoot,
        setFolderRightRoot: vi.fn(),
        setFolderCurrentPath,
        setFolderResult,
        setFolderStatus,
        setFolderRecentPairs: vi.fn(),
        setSelectedFolderItemPath,
      }),
    )

    await act(async () => {
      await result.current.browseFolderRoot('left')
    })

    expect(setFolderLeftRoot).toHaveBeenCalledWith('/picked')
    expect(setFolderCurrentPath).toHaveBeenCalledWith('')
    expect(setSelectedFolderItemPath).toHaveBeenCalledWith('')
    expect(setFolderResult).toHaveBeenCalledWith(null)
    expect(setFolderStatus).toHaveBeenCalledWith('')
  })

  it('effect reruns compare when currentPath diverges from result path', async () => {
    const compareFolders = vi.fn(async () => createResponse('new/path'))

    renderHook(() =>
      useDirectoryCompareWorkflow({
        isFolderMode: true,
        folderLeftRoot: '/left',
        folderRightRoot: '/right',
        folderNameFilter: '',
        folderCurrentPath: 'old/path',
        folderResult: createResponse('new/path'),
        folderViewMode: 'list',
        compareFolders,
        setFolderLeftRoot: vi.fn(),
        setFolderRightRoot: vi.fn(),
        setFolderCurrentPath: vi.fn(),
        setFolderResult: vi.fn(),
        setFolderStatus: vi.fn(),
        setFolderRecentPairs: vi.fn(),
        setSelectedFolderItemPath: vi.fn(),
      }),
    )

    await waitFor(() => {
      expect(compareFolders).toHaveBeenCalled()
    })
  })
})

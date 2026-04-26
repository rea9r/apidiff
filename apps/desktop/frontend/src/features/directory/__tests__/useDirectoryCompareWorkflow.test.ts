import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CompareDirectoriesRequest, CompareDirectoriesResponse, DesktopRecentDirectoryPair } from '../../../types'
import { useDirectoryCompareWorkflow } from '../useDirectoryCompareWorkflow'

function createResponse(currentPath: string): CompareDirectoriesResponse {
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
  it('runDirectoryCompare updates result/currentPath and recent pair', async () => {
    const compareDirectories = vi.fn(async (req: CompareDirectoriesRequest) => createResponse(req.currentPath))
    const setDirectoryRecentPairs = vi.fn()
    const setDirectoryResult = vi.fn()
    const setDirectoryCurrentPath = vi.fn()
    const setDirectoryStatus = vi.fn()

    const { result } = renderHook(() =>
      useDirectoryCompareWorkflow({
        isDirectoryMode: true,
        directoryLeftRoot: '/left',
        directoryRightRoot: '/right',
        directoryNameFilter: '',
        directoryCurrentPath: 'a/b',
        directoryResult: null,
        directoryViewMode: 'tree',
        compareDirectories,
        setDirectoryLeftRoot: vi.fn(),
        setDirectoryRightRoot: vi.fn(),
        setDirectoryCurrentPath,
        setDirectoryResult,
        setDirectoryStatus,
        setDirectoryRecentPairs,
        setSelectedDirectoryItemPath: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.runDirectoryCompare('a/b')
    })

    expect(compareDirectories).toHaveBeenCalledWith({
      leftRoot: '/left',
      rightRoot: '/right',
      currentPath: 'a/b',
      recursive: true,
      showSame: true,
      nameFilter: '',
    })
    expect(setDirectoryResult).toHaveBeenCalled()
    expect(setDirectoryCurrentPath).toHaveBeenCalledWith('a/b')
    expect(setDirectoryStatus).toHaveBeenCalledWith('')

    const updater = setDirectoryRecentPairs.mock.calls[0][0] as (prev: DesktopRecentDirectoryPair[]) => DesktopRecentDirectoryPair[]
    const updated = updater([])
    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      leftRoot: '/left',
      rightRoot: '/right',
      currentPath: 'a/b',
      viewMode: 'tree',
    })
  })

  it('browseDirectoryRoot resets state when directory selected', async () => {
    const setDirectoryLeftRoot = vi.fn()
    const setDirectoryCurrentPath = vi.fn()
    const setSelectedDirectoryItemPath = vi.fn()
    const setDirectoryResult = vi.fn()
    const setDirectoryStatus = vi.fn()

    const { result } = renderHook(() =>
      useDirectoryCompareWorkflow({
        isDirectoryMode: true,
        directoryLeftRoot: '',
        directoryRightRoot: '',
        directoryNameFilter: '',
        directoryCurrentPath: '',
        directoryResult: null,
        directoryViewMode: 'list',
        pickDirectoryRoot: async () => '/picked',
        setDirectoryLeftRoot,
        setDirectoryRightRoot: vi.fn(),
        setDirectoryCurrentPath,
        setDirectoryResult,
        setDirectoryStatus,
        setDirectoryRecentPairs: vi.fn(),
        setSelectedDirectoryItemPath,
      }),
    )

    await act(async () => {
      await result.current.browseDirectoryRoot('left')
    })

    expect(setDirectoryLeftRoot).toHaveBeenCalledWith('/picked')
    expect(setDirectoryCurrentPath).toHaveBeenCalledWith('')
    expect(setSelectedDirectoryItemPath).toHaveBeenCalledWith('')
    expect(setDirectoryResult).toHaveBeenCalledWith(null)
    expect(setDirectoryStatus).toHaveBeenCalledWith('')
  })

  it('effect reruns compare when currentPath diverges from result path', async () => {
    const compareDirectories = vi.fn(async () => createResponse('new/path'))

    renderHook(() =>
      useDirectoryCompareWorkflow({
        isDirectoryMode: true,
        directoryLeftRoot: '/left',
        directoryRightRoot: '/right',
        directoryNameFilter: '',
        directoryCurrentPath: 'old/path',
        directoryResult: createResponse('new/path'),
        directoryViewMode: 'list',
        compareDirectories,
        setDirectoryLeftRoot: vi.fn(),
        setDirectoryRightRoot: vi.fn(),
        setDirectoryCurrentPath: vi.fn(),
        setDirectoryResult: vi.fn(),
        setDirectoryStatus: vi.fn(),
        setDirectoryRecentPairs: vi.fn(),
        setSelectedDirectoryItemPath: vi.fn(),
      }),
    )

    await waitFor(() => {
      expect(compareDirectories).toHaveBeenCalled()
    })
  })
})

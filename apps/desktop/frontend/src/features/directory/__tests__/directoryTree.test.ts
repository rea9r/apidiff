import { describe, expect, it } from 'vitest'
import {
  buildDirectoryBreadcrumbs,
  filterDirectoryTreeNodesByQuickFilter,
  toggleDirectorySort,
  type DirectoryTreeNode,
} from '../directoryTree'
import type { DirectoryCompareItem } from '../../../types'

function makeItem(
  relativePath: string,
  status: DirectoryCompareItem['status'],
  isDir: boolean,
): DirectoryCompareItem {
  return {
    name: relativePath.split('/').pop() ?? relativePath,
    relativePath,
    isDir,
    status,
    leftPath: `/left/${relativePath}`,
    rightPath: `/right/${relativePath}`,
    leftExists: true,
    rightExists: true,
    leftKind: isDir ? 'dir' : 'file',
    rightKind: isDir ? 'dir' : 'file',
    leftSize: isDir ? 0 : 10,
    rightSize: isDir ? 0 : 20,
    compareModeHint: isDir ? 'none' : 'text',
  }
}

function makeNode(path: string, status: DirectoryCompareItem['status'], children: DirectoryTreeNode[] = []): DirectoryTreeNode {
  const isDir = children.length > 0
  return {
    path,
    name: path.split('/').pop() ?? path,
    isDir,
    status,
    item: makeItem(path, status, isDir),
    children,
    loaded: true,
    expanded: false,
  }
}

describe('directoryTree helpers', () => {
  it('toggleDirectorySort flips direction when sorting same key', () => {
    expect(toggleDirectorySort('name', 'name', 'asc')).toEqual({ key: 'name', dir: 'desc' })
    expect(toggleDirectorySort('name', 'name', 'desc')).toEqual({ key: 'name', dir: 'asc' })
  })

  it('toggleDirectorySort resets to asc when key changes', () => {
    expect(toggleDirectorySort('status', 'name', 'desc')).toEqual({ key: 'status', dir: 'asc' })
  })

  it('filterDirectoryTreeNodesByQuickFilter keeps parent when child matches', () => {
    const tree = [
      makeNode('root', 'same', [
        makeNode('root/file-same.txt', 'same'),
        makeNode('root/file-error.txt', 'error'),
      ]),
    ]

    const filtered = filterDirectoryTreeNodesByQuickFilter(tree, 'error')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].path).toBe('root')
    expect(filtered[0].children).toHaveLength(1)
    expect(filtered[0].children?.[0].path).toBe('root/file-error.txt')
  })

  it('buildDirectoryBreadcrumbs returns root and nested crumbs', () => {
    expect(buildDirectoryBreadcrumbs('')).toEqual([{ label: 'Root', path: '' }])
    expect(buildDirectoryBreadcrumbs('a/b')).toEqual([
      { label: 'Root', path: '' },
      { label: 'a', path: 'a' },
      { label: 'b', path: 'a/b' },
    ])
  })
})

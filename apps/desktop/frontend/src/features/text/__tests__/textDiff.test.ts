import { describe, expect, it } from 'vitest'
import {
  buildRichDiffItems,
  buildTextDiffBlocks,
  buildTextRulerMarks,
  buildTextSearchRowIDForItem,
  parseUnifiedDiff,
  summarizeTextDiffCounts,
} from '../textDiff'

describe('textDiff helpers', () => {
  it('parses unified diff rows and counts add/remove lines', () => {
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,2 +1,2 @@',
      '-old line',
      '+new line',
      ' shared',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)
    expect(rows).not.toBeNull()

    const counts = summarizeTextDiffCounts(rows)
    expect(counts).toEqual({ added: 1, removed: 1 })
  })

  it('returns null for invalid hunk header', () => {
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ invalid @@',
      '-old line',
      '+new line',
    ].join('\n')

    expect(parseUnifiedDiff(raw)).toBeNull()
  })
})

describe('buildTextDiffBlocks', () => {
  it('returns empty list when there are no changes', () => {
    const oldText = 'a\nb\nc\n'
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,3 +1,3 @@',
      ' a',
      ' b',
      ' c',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)!
    const items = buildRichDiffItems(rows, oldText, oldText)
    expect(buildTextDiffBlocks(items)).toEqual([])
  })

  it('groups consecutive add/remove rows into a single block', () => {
    const oldText = 'a\nb\nc\n'
    const newText = 'a\nB1\nB2\nc\n'
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,3 +1,4 @@',
      ' a',
      '-b',
      '+B1',
      '+B2',
      ' c',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)!
    const items = buildRichDiffItems(rows, oldText, newText)
    const blocks = buildTextDiffBlocks(items)
    expect(blocks).toHaveLength(1)

    const firstChangeIndex = items.findIndex(
      (item) =>
        item.kind === 'row' && (item.row.kind === 'add' || item.row.kind === 'remove'),
    )
    expect(blocks[0].id).toBe(buildTextSearchRowIDForItem(firstChangeIndex))
  })

  it('treats blocks separated by context as distinct', () => {
    const oldText = 'a\nb\nc\nd\n'
    const newText = 'A\nb\nc\nD\n'
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,4 +1,4 @@',
      '-a',
      '+A',
      ' b',
      ' c',
      '-d',
      '+D',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)!
    const items = buildRichDiffItems(rows, oldText, newText)
    expect(buildTextDiffBlocks(items)).toHaveLength(2)
  })
})

describe('buildTextRulerMarks', () => {
  it('returns an empty list when no rows changed', () => {
    const oldText = 'a\nb\nc\n'
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,3 +1,3 @@',
      ' a',
      ' b',
      ' c',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)!
    const items = buildRichDiffItems(rows, oldText, oldText)
    expect(buildTextRulerMarks(items)).toEqual([])
  })

  it('classifies marks as add, remove, and change', () => {
    const oldText = 'a\nb\nc\nd\ne\n'
    const newText = 'a\nB\nc\nd\nE\nf\n'
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,5 +1,6 @@',
      ' a',
      '-b',
      '+B',
      ' c',
      ' d',
      '-e',
      '+E',
      '+f',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)!
    const items = buildRichDiffItems(rows, oldText, newText)
    const marks = buildTextRulerMarks(items)
    const kinds = marks.map((mark) => mark.kind)
    expect(kinds).toEqual(['change', 'change'])
    const ids = marks.map((mark) => mark.id)
    expect(ids[0]).toMatch(/^search-row-/)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks pure-add and pure-remove blocks separately', () => {
    const oldText = 'a\nb\n'
    const newText = 'a\nb\nC\n'
    const raw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,2 +1,3 @@',
      ' a',
      ' b',
      '+C',
    ].join('\n')

    const rows = parseUnifiedDiff(raw)!
    const items = buildRichDiffItems(rows, oldText, newText)
    const marks = buildTextRulerMarks(items)
    expect(marks.map((m) => m.kind)).toEqual(['add'])

    const removalRaw = [
      '--- a.txt',
      '+++ b.txt',
      '@@ -1,3 +1,2 @@',
      ' a',
      ' b',
      '-C',
    ].join('\n')
    const removalRows = parseUnifiedDiff(removalRaw)!
    const removalItems = buildRichDiffItems(removalRows, 'a\nb\nC\n', 'a\nb\n')
    const removalMarks = buildTextRulerMarks(removalItems)
    expect(removalMarks.map((m) => m.kind)).toEqual(['remove'])

    expect(buildTextSearchRowIDForItem).toBeDefined()
  })
})

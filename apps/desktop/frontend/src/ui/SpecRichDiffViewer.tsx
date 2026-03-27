import { Fragment, useEffect, useMemo, useState } from 'react'
import type { SpecRichDiffItem } from '../types'
import { CompareValueBlock } from './CompareValueBlock'
import { SpecDiffSection } from './SpecDiffSection'

type SpecRichDiffViewerProps = {
  diffs: SpecRichDiffItem[]
  searchQuery: string
  searchMatchIndexSet: Set<number>
  activeMatchIndex: number
}

type SpecDiffGroup = {
  key: string
  items: Array<{ diff: SpecRichDiffItem; index: number }>
  summary: {
    added: number
    removed: number
    changed: number
    typeChanged: number
    breaking: number
  }
}

function stringifyValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function renderTypeLabel(type: SpecRichDiffItem['type']) {
  if (type === 'type_changed') return 'type changed'
  return type
}

function buildGroups(diffs: SpecRichDiffItem[]): SpecDiffGroup[] {
  const map = new Map<string, SpecDiffGroup>()
  diffs.forEach((diff, index) => {
    const key = diff.groupKey || '(other)'
    const group =
      map.get(key) ??
      {
        key,
        items: [],
        summary: { added: 0, removed: 0, changed: 0, typeChanged: 0, breaking: 0 },
      }

    group.items.push({ diff, index })
    if (diff.type === 'added') group.summary.added++
    else if (diff.type === 'removed') group.summary.removed++
    else if (diff.type === 'changed') group.summary.changed++
    else if (diff.type === 'type_changed') group.summary.typeChanged++
    if (diff.breaking) group.summary.breaking++

    map.set(key, group)
  })

  return [...map.values()]
}

function highlightText(value: string, normalizedQuery: string) {
  if (!normalizedQuery) {
    return value
  }

  const lower = value.toLowerCase()
  const parts: Array<{ text: string; hit: boolean }> = []
  let cursor = 0

  while (cursor < value.length) {
    const found = lower.indexOf(normalizedQuery, cursor)
    if (found === -1) {
      parts.push({ text: value.slice(cursor), hit: false })
      break
    }

    if (found > cursor) {
      parts.push({ text: value.slice(cursor, found), hit: false })
    }
    parts.push({ text: value.slice(found, found + normalizedQuery.length), hit: true })
    cursor = found + normalizedQuery.length
  }

  return parts.map((part, index) =>
    part.hit ? (
      <span key={`hit-${index}`} className="json-search-hit">
        {part.text}
      </span>
    ) : (
      <span key={`plain-${index}`}>{part.text}</span>
    ),
  )
}

function SpecValueCell({
  value,
  valueKey,
  expanded,
  onToggle,
}: {
  value: unknown
  valueKey: string
  expanded: boolean
  onToggle: (valueKey: string) => void
}) {
  if (value === undefined) {
    return <span className="muted">—</span>
  }

  if (value === null) {
    return <CompareValueBlock inline>null</CompareValueBlock>
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <CompareValueBlock inline>{String(value)}</CompareValueBlock>
  }

  const rendered = stringifyValue(value)
  const lines = rendered.split('\n')
  const canExpand = lines.length > 5
  const shown = canExpand && !expanded ? [...lines.slice(0, 5), '...'] : lines

  return (
    <div className="json-value-wrap">
      <CompareValueBlock expanded={expanded}>{shown.join('\n')}</CompareValueBlock>
      {canExpand ? (
        <button
          type="button"
          className="button-secondary button-compact json-value-toggle"
          onClick={() => onToggle(valueKey)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      ) : null}
    </div>
  )
}

export function SpecRichDiffViewer({
  diffs,
  searchQuery,
  searchMatchIndexSet,
  activeMatchIndex,
}: SpecRichDiffViewerProps) {
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([])
  const [expandedValueKeys, setExpandedValueKeys] = useState<string[]>([])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const groups = useMemo(() => buildGroups(diffs), [diffs])

  useEffect(() => {
    setExpandedGroupKeys(groups.map((group) => group.key))
    setExpandedValueKeys([])
  }, [groups])

  const matchGroupKeys = useMemo(() => {
    const keys = new Set<string>()
    diffs.forEach((diff, index) => {
      if (searchMatchIndexSet.has(index)) {
        keys.add(diff.groupKey || '(other)')
      }
    })
    return keys
  }, [diffs, searchMatchIndexSet])

  const effectiveExpandedGroups = useMemo(() => {
    const keys = new Set<string>(expandedGroupKeys)
    matchGroupKeys.forEach((key) => keys.add(key))
    return keys
  }, [expandedGroupKeys, matchGroupKeys])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroupKeys((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
        : [...prev, groupKey],
    )
  }

  const toggleValue = (valueKey: string) => {
    setExpandedValueKeys((prev) =>
      prev.includes(valueKey)
        ? prev.filter((key) => key !== valueKey)
        : [...prev, valueKey],
    )
  }

  return (
    <div className="spec-diff-table-wrap">
      {diffs.length === 0 ? (
        <div className="compare-status-state success-empty">No differences</div>
      ) : (
        <table className="spec-diff-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Label</th>
              <th>Path</th>
              <th>Old</th>
              <th>New</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const expanded = effectiveExpandedGroups.has(group.key)
              return (
                <Fragment key={`spec-group-${group.key}`}>
                  <tr className="spec-group-row">
                    <td colSpan={5}>
                      <SpecDiffSection
                        groupKey={group.key}
                        itemCount={group.items.length}
                        collapsed={!expanded}
                        onToggle={() => toggleGroup(group.key)}
                        badges={
                          <>
                            {group.summary.added > 0 ? (
                              <span className="json-group-stat added">+{group.summary.added}</span>
                            ) : null}
                            {group.summary.removed > 0 ? (
                              <span className="json-group-stat removed">-{group.summary.removed}</span>
                            ) : null}
                            {group.summary.changed > 0 ? (
                              <span className="json-group-stat changed">~{group.summary.changed}</span>
                            ) : null}
                            {group.summary.typeChanged > 0 ? (
                              <span className="json-group-stat type-changed">
                                type {group.summary.typeChanged}
                              </span>
                            ) : null}
                            {group.summary.breaking > 0 ? (
                              <span className="json-breaking-badge">breaking {group.summary.breaking}</span>
                            ) : null}
                          </>
                        }
                      />
                    </td>
                  </tr>
                  {expanded
                    ? group.items.map(({ diff, index }) => {
                        const searchHit = searchMatchIndexSet.has(index)
                        const activeHit = activeMatchIndex === index
                        return (
                          <tr
                            key={`spec-diff-${index}-${diff.path}`}
                            className={[
                              'spec-diff-row',
                              diff.type,
                              searchHit ? 'search-hit' : '',
                              activeHit ? 'active-search-hit' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <td className="spec-diff-cell spec-diff-cell-type">
                              <div className="json-cell-inline json-type-cell">
                                <span className={`json-type-badge ${diff.type}`}>
                                  {renderTypeLabel(diff.type)}
                                </span>
                                {diff.breaking ? (
                                  <span className="json-breaking-badge">breaking</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="spec-label-cell">
                              {highlightText(diff.label, normalizedQuery)}
                            </td>
                            <td className="spec-diff-cell spec-diff-cell-path">
                              <div className="json-cell-inline json-path-cell">
                                {highlightText(diff.path, normalizedQuery)}
                              </div>
                            </td>
                            <td>
                              <SpecValueCell
                                value={diff.oldValue}
                                valueKey={`${index}:${diff.path}:old`}
                                expanded={expandedValueKeys.includes(`${index}:${diff.path}:old`)}
                                onToggle={toggleValue}
                              />
                            </td>
                            <td>
                              <SpecValueCell
                                value={diff.newValue}
                                valueKey={`${index}:${diff.path}:new`}
                                expanded={expandedValueKeys.includes(`${index}:${diff.path}:new`)}
                                onToggle={toggleValue}
                              />
                            </td>
                          </tr>
                        )
                      })
                    : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

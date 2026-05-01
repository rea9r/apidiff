import type { ReactNode } from 'react'
import {
  buildExpandedContextRow,
  buildTextSearchRowIDForItem,
  buildTextSearchRowIDForOmitted,
  shouldHideTextRichMetaRow,
  shouldShowTextHunkHeaders,
  type RichDiffItem,
  type TextChangeBlock,
  type UnifiedDiffRow,
} from '../features/text/textDiff'
import {
  combineRowClassNames,
  DEFAULT_SPLIT_HEADER_LABELS,
  getNavClassName,
  getSearchClassName,
  maybeRegisterSearchRowRef,
  renderAdoptFloatingButtons,
  renderOmittedBannerContent,
  renderSplitDiffCell,
  resolveOmittedExpansion,
  type AdoptBlockHandler,
  type OmittedSectionConfig,
  type SearchRowRefRegistrar,
  type SplitHeaderLabels,
} from './richDiffShared'

export function renderSplitRows(params: {
  items: RichDiffItem[]
  keyPrefix: string
  wrap: boolean
  searchMatchIds?: Set<string>
  activeMatchId?: string | null
  navMatchIds?: Set<string>
  activeNavMatchId?: string | null
  registerSearchRowRef?: SearchRowRefRegistrar
  omittedSections?: OmittedSectionConfig
  splitHeaderLabels?: SplitHeaderLabels
  blocksByStart?: Map<number, TextChangeBlock>
  onAdoptBlock?: AdoptBlockHandler
}) {
  const {
    items,
    keyPrefix,
    wrap,
    searchMatchIds,
    activeMatchId,
    navMatchIds,
    activeNavMatchId,
    registerSearchRowRef,
    omittedSections,
    splitHeaderLabels,
    blocksByStart,
    onAdoptBlock,
  } = params
  const showHunkHeaders = shouldShowTextHunkHeaders(items)
  const labels = splitHeaderLabels ?? DEFAULT_SPLIT_HEADER_LABELS
  const splitNodes: ReactNode[] = []
  let index = 0

  const renderSplitOmittedLine = (
    item: Extract<RichDiffItem, { kind: 'omitted' }>,
    lineIndex: number,
  ) => {
    const line = item.lines[lineIndex]
    const row = buildExpandedContextRow(
      line,
      item.startOldLine + lineIndex,
      item.startNewLine + lineIndex,
    )
    const matchId = buildTextSearchRowIDForOmitted(item.sectionId, lineIndex)
    const searchClassName = getSearchClassName(searchMatchIds, activeMatchId, matchId)
    const navClassName = getNavClassName(navMatchIds, activeNavMatchId, matchId)
    const highlightClassName = combineRowClassNames(searchClassName, navClassName)

    return (
      <div
        key={`${keyPrefix}-split-omitted-row-${item.sectionId}-${lineIndex}`}
        className="split-diff-row"
      >
        {renderSplitDiffCell(
          row,
          'left',
          `${keyPrefix}-split-omitted-left-${item.sectionId}-${lineIndex}`,
          highlightClassName,
          maybeRegisterSearchRowRef(
            registerSearchRowRef,
            searchMatchIds,
            navMatchIds,
            matchId,
          ),
        )}
        {renderSplitDiffCell(
          row,
          'right',
          `${keyPrefix}-split-omitted-right-${item.sectionId}-${lineIndex}`,
          highlightClassName,
        )}
      </div>
    )
  }

  while (index < items.length) {
    const item = items[index]

    if (item.kind === 'omitted') {
      const total = item.lines.length
      const resolved = resolveOmittedExpansion(omittedSections, item.sectionId, total)
      const next = items[index + 1]
      const nextIsHunk = next?.kind === 'row' && next.row.kind === 'hunk'
      let mergedHunk: string | null = null
      let consumeNextHunk = false
      if (resolved.hasGranularControls && showHunkHeaders && nextIsHunk) {
        if (resolved.fullyExpanded) {
          consumeNextHunk = true
        } else if (resolved.expansion.bottom === 0) {
          mergedHunk = next.row.content
          consumeNextHunk = true
        }
      }
      const { top, bottom } = resolved.expansion
      const topLines: ReactNode[] = []
      for (let i = 0; i < top; i++) {
        topLines.push(renderSplitOmittedLine(item, i))
      }
      const bottomLines: ReactNode[] = []
      for (let i = total - bottom; i < total; i++) {
        bottomLines.push(renderSplitOmittedLine(item, i))
      }

      if (resolved.hasGranularControls && resolved.fullyExpanded) {
        splitNodes.push(
          <div
            key={`${keyPrefix}-split-omitted-${item.sectionId}`}
            className="split-omitted-block"
          >
            {topLines}
          </div>,
        )
        index += consumeNextHunk ? 2 : 1
        continue
      }

      const splitBannerClass = `split-diff-banner omitted${
        resolved.hasGranularControls ? '' : ' expanded'
      }${mergedHunk ? ' with-hunk' : ''}`
      const banner = (
        <div
          key={`${keyPrefix}-split-omitted-banner-${item.sectionId}`}
          className={splitBannerClass}
        >
          <div className="split-omitted-banner-inner">
            {renderOmittedBannerContent(item.sectionId, resolved, omittedSections, mergedHunk)}
          </div>
        </div>
      )

      if (!resolved.hasGranularControls) {
        splitNodes.push(
          <div
            key={`${keyPrefix}-split-omitted-${item.sectionId}`}
            className="split-omitted-block"
          >
            {banner}
            {topLines}
          </div>,
        )
      } else {
        splitNodes.push(
          <div
            key={`${keyPrefix}-split-omitted-${item.sectionId}`}
            className="split-omitted-block"
          >
            {topLines}
            {banner}
            {bottomLines}
          </div>,
        )
      }
      index += consumeNextHunk ? 2 : 1
      continue
    }

    const row = item.row
    if (row.kind === 'meta' || row.kind === 'hunk') {
      if (shouldHideTextRichMetaRow(row)) {
        index++
        continue
      }
      if (row.kind === 'hunk' && !showHunkHeaders) {
        index++
        continue
      }

      splitNodes.push(
        <div key={`${keyPrefix}-split-banner-${index}`} className={`split-diff-banner ${row.kind}`}>
          <pre className="split-diff-banner-content">{row.content}</pre>
        </div>,
      )
      index++
      continue
    }

    if (row.kind === 'context') {
      const matchId = buildTextSearchRowIDForItem(index)
      const searchClassName = getSearchClassName(searchMatchIds, activeMatchId, matchId)
      const navClassName = getNavClassName(navMatchIds, activeNavMatchId, matchId)
      const highlightClassName = combineRowClassNames(searchClassName, navClassName)

      splitNodes.push(
        <div key={`${keyPrefix}-split-row-${index}`} className="split-diff-row">
          {renderSplitDiffCell(
            row,
            'left',
            `${keyPrefix}-split-left-${index}`,
            highlightClassName,
            maybeRegisterSearchRowRef(
              registerSearchRowRef,
              searchMatchIds,
              navMatchIds,
              matchId,
            ),
          )}
          {renderSplitDiffCell(row, 'right', `${keyPrefix}-split-right-${index}`, highlightClassName)}
        </div>,
      )
      index++
      continue
    }

    const adoptBlock = blocksByStart?.get(index)

    const removed: Array<{ row: UnifiedDiffRow; matchId: string }> = []
    const added: Array<{ row: UnifiedDiffRow; matchId: string }> = []
    let end = index

    while (end < items.length) {
      const candidate = items[end]
      if (candidate.kind !== 'row') {
        break
      }
      if (candidate.row.kind !== 'remove' && candidate.row.kind !== 'add') {
        break
      }

      const matchId = buildTextSearchRowIDForItem(end)
      if (candidate.row.kind === 'remove') {
        removed.push({ row: candidate.row, matchId })
      } else {
        added.push({ row: candidate.row, matchId })
      }
      end++
    }

    const pairCount = Math.max(removed.length, added.length)
    const pairNodes: ReactNode[] = []
    for (let pairIndex = 0; pairIndex < pairCount; pairIndex++) {
      const left = removed[pairIndex] ?? null
      const right = added[pairIndex] ?? null
      const leftClassName = left
        ? combineRowClassNames(
            getSearchClassName(searchMatchIds, activeMatchId, left.matchId),
            getNavClassName(navMatchIds, activeNavMatchId, left.matchId),
          )
        : ''
      const rightClassName = right
        ? combineRowClassNames(
            getSearchClassName(searchMatchIds, activeMatchId, right.matchId),
            getNavClassName(navMatchIds, activeNavMatchId, right.matchId),
          )
        : ''

      pairNodes.push(
        <div key={`${keyPrefix}-split-pair-${index}-${pairIndex}`} className="split-diff-row">
          {renderSplitDiffCell(
            left?.row ?? null,
            'left',
            `${keyPrefix}-split-pair-left-${index}-${pairIndex}`,
            leftClassName,
            left
              ? maybeRegisterSearchRowRef(
                  registerSearchRowRef,
                  searchMatchIds,
                  navMatchIds,
                  left.matchId,
                )
              : undefined,
          )}
          {renderSplitDiffCell(
            right?.row ?? null,
            'right',
            `${keyPrefix}-split-pair-right-${index}-${pairIndex}`,
            rightClassName,
            right
              ? maybeRegisterSearchRowRef(
                  registerSearchRowRef,
                  searchMatchIds,
                  navMatchIds,
                  right.matchId,
                )
              : undefined,
          )}
        </div>,
      )
    }

    if (adoptBlock && onAdoptBlock && pairNodes.length > 0) {
      splitNodes.push(
        <div
          key={`${keyPrefix}-split-change-${index}`}
          className="split-diff-change-group"
        >
          {pairNodes}
          {renderAdoptFloatingButtons(adoptBlock, 'split', onAdoptBlock, `${keyPrefix}-split-${index}`)}
        </div>,
      )
    } else {
      for (const node of pairNodes) {
        splitNodes.push(node)
      }
    }

    index = end
  }

  const gridClassName = `split-diff-grid${wrap ? '' : ' no-wrap'}`

  return (
    <div className={gridClassName}>
      <div className="split-diff-header">
        <div className="split-diff-header-cell">{labels.left}</div>
        <div className="split-diff-header-cell">{labels.right}</div>
      </div>
      {splitNodes}
    </div>
  )
}

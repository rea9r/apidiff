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
  getNavClassName,
  getSearchClassName,
  maybeRegisterSearchRowRef,
  renderAdoptFloatingButtons,
  renderInlineDiffContent,
  renderOmittedBannerContent,
  resolveOmittedExpansion,
  type AdoptBlockHandler,
  type OmittedSectionConfig,
  type SearchRowRefRegistrar,
} from './richDiffShared'

export function renderUnifiedRows(params: {
  items: RichDiffItem[]
  keyPrefix: string
  wrap: boolean
  searchMatchIds?: Set<string>
  activeMatchId?: string | null
  navMatchIds?: Set<string>
  activeNavMatchId?: string | null
  registerSearchRowRef?: SearchRowRefRegistrar
  omittedSections?: OmittedSectionConfig
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
    blocksByStart,
    onAdoptBlock,
  } = params
  const showHunkHeaders = shouldShowTextHunkHeaders(items)
  const gridClassName = `text-diff-grid${wrap ? '' : ' no-wrap'}`

  const mergedHunkByOmittedIdx = new Map<number, string>()
  const consumedHunkIdxs = new Set<number>()
  items.forEach((item, idx) => {
    if (item.kind !== 'omitted') return
    const resolved = resolveOmittedExpansion(omittedSections, item.sectionId, item.lines.length)
    if (!resolved.hasGranularControls || !showHunkHeaders) return
    const next = items[idx + 1]
    if (next?.kind !== 'row' || next.row.kind !== 'hunk') return
    if (resolved.fullyExpanded) {
      consumedHunkIdxs.add(idx + 1)
      return
    }
    if (resolved.expansion.bottom === 0) {
      mergedHunkByOmittedIdx.set(idx, next.row.content)
      consumedHunkIdxs.add(idx + 1)
    }
  })

  const renderUnifiedOmittedLine = (
    item: Extract<RichDiffItem, { kind: 'omitted' }>,
    index: number,
  ) => {
    const line = item.lines[index]
    const row = buildExpandedContextRow(
      line,
      item.startOldLine + index,
      item.startNewLine + index,
    )
    const matchId = buildTextSearchRowIDForOmitted(item.sectionId, index)
    const searchClassName = getSearchClassName(searchMatchIds, activeMatchId, matchId)
    const navClassName = getNavClassName(navMatchIds, activeNavMatchId, matchId)

    return (
      <div
        key={`${keyPrefix}-${item.sectionId}-${index}`}
        ref={maybeRegisterSearchRowRef(
          registerSearchRowRef,
          searchMatchIds,
          navMatchIds,
          matchId,
        )}
        className={combineRowClassNames(
          'text-diff-row',
          row.kind,
          searchClassName,
          navClassName,
        )}
      >
        <div className="text-diff-line">{row.oldLine ?? ''}</div>
        <div className="text-diff-line">{row.newLine ?? ''}</div>
        <pre className="text-diff-content">{row.content}</pre>
      </div>
    )
  }

  const renderUnifiedRow = (row: UnifiedDiffRow, itemIndex: number): ReactNode => {
    const matchId = buildTextSearchRowIDForItem(itemIndex)
    const searchClassName = getSearchClassName(searchMatchIds, activeMatchId, matchId)
    const navClassName = getNavClassName(navMatchIds, activeNavMatchId, matchId)

    return (
      <div
        key={`${keyPrefix}-${itemIndex}-${row.kind}`}
        ref={maybeRegisterSearchRowRef(
          registerSearchRowRef,
          searchMatchIds,
          navMatchIds,
          matchId,
        )}
        className={combineRowClassNames('text-diff-row', row.kind, searchClassName, navClassName)}
      >
        <div className="text-diff-line">{row.oldLine ?? ''}</div>
        <div className="text-diff-line">{row.newLine ?? ''}</div>
        <pre className="text-diff-content">
          {renderInlineDiffContent(row, `${keyPrefix}-diff-${itemIndex}`)}
        </pre>
      </div>
    )
  }

  const nodes: ReactNode[] = []
  let idx = 0
  while (idx < items.length) {
    if (consumedHunkIdxs.has(idx)) {
      idx++
      continue
    }
    const item = items[idx]
    if (item.kind === 'omitted') {
      const total = item.lines.length
      const resolved = resolveOmittedExpansion(omittedSections, item.sectionId, total)
      const mergedHunk = mergedHunkByOmittedIdx.get(idx) ?? null
      const { top, bottom } = resolved.expansion
      const topLines: ReactNode[] = []
      for (let i = 0; i < top; i++) {
        topLines.push(renderUnifiedOmittedLine(item, i))
      }
      const bottomLines: ReactNode[] = []
      for (let i = total - bottom; i < total; i++) {
        bottomLines.push(renderUnifiedOmittedLine(item, i))
      }

      if (resolved.hasGranularControls && resolved.fullyExpanded) {
        nodes.push(
          <div key={`${keyPrefix}-${item.sectionId}`} className="text-omitted-block">
            {topLines}
          </div>,
        )
        idx++
        continue
      }

      const bannerClass = `text-omitted-banner${
        resolved.hasGranularControls ? '' : ' expanded'
      }${mergedHunk ? ' with-hunk' : ''}`
      const banner = (
        <div key={`${keyPrefix}-${item.sectionId}-banner`} className={bannerClass}>
          {renderOmittedBannerContent(item.sectionId, resolved, omittedSections, mergedHunk)}
        </div>
      )

      if (!resolved.hasGranularControls) {
        nodes.push(
          <div key={`${keyPrefix}-${item.sectionId}`} className="text-omitted-block">
            {banner}
            {topLines}
          </div>,
        )
      } else {
        nodes.push(
          <div key={`${keyPrefix}-${item.sectionId}`} className="text-omitted-block">
            {topLines}
            {banner}
            {bottomLines}
          </div>,
        )
      }
      idx++
      continue
    }

    const row = item.row
    if (shouldHideTextRichMetaRow(row)) {
      idx++
      continue
    }
    if (row.kind === 'hunk' && !showHunkHeaders) {
      idx++
      continue
    }

    const adoptBlock = blocksByStart?.get(idx)
    if (adoptBlock && onAdoptBlock) {
      const blockNodes: ReactNode[] = []
      for (let i = idx; i < adoptBlock.endItemIndex; i++) {
        const blockItem = items[i]
        if (blockItem.kind !== 'row') continue
        const blockRow = blockItem.row
        if (shouldHideTextRichMetaRow(blockRow)) continue
        if (blockRow.kind === 'hunk' && !showHunkHeaders) continue
        blockNodes.push(renderUnifiedRow(blockRow, i))
      }
      nodes.push(
        <div
          key={`${keyPrefix}-change-${idx}`}
          className="text-diff-change-group"
        >
          {blockNodes}
          {renderAdoptFloatingButtons(adoptBlock, 'unified', onAdoptBlock, `${keyPrefix}-${idx}`)}
        </div>,
      )
      idx = adoptBlock.endItemIndex
      continue
    }

    nodes.push(renderUnifiedRow(row, idx))
    idx++
  }

  return <div className={gridClassName}>{nodes}</div>
}

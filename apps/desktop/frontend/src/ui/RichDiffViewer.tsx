import { useEffect, useMemo, useState } from 'react'
import {
  type RichDiffItem,
  type TextChangeBlock,
} from '../features/text/textDiff'
import {
  DEFAULT_INITIAL_VISIBLE_ITEMS,
  type AdoptBlockHandler,
  type OmittedSectionConfig,
  type SearchRowRefRegistrar,
  type SplitHeaderLabels,
} from './richDiffShared'
import { renderUnifiedRows } from './richDiffUnifiedRenderer'
import { renderSplitRows } from './richDiffSplitRenderer'

export type { AdoptBlockHandler } from './richDiffShared'
export { createSearchRowRefRegistrar } from './richDiffShared'

type RichDiffViewerProps = {
  items: RichDiffItem[]
  layout: 'split' | 'unified'
  keyPrefix: string
  wrap?: boolean
  searchMatchIds?: Set<string>
  activeMatchId?: string | null
  navMatchIds?: Set<string>
  activeNavMatchId?: string | null
  registerSearchRowRef?: SearchRowRefRegistrar
  omittedSections?: OmittedSectionConfig
  splitHeaderLabels?: SplitHeaderLabels
  initialVisibleItems?: number
  changeBlocks?: TextChangeBlock[]
  onAdoptBlock?: AdoptBlockHandler
}

export function RichDiffViewer({
  items,
  layout,
  keyPrefix,
  wrap = true,
  searchMatchIds,
  activeMatchId,
  navMatchIds,
  activeNavMatchId,
  registerSearchRowRef,
  omittedSections,
  splitHeaderLabels,
  initialVisibleItems = DEFAULT_INITIAL_VISIBLE_ITEMS,
  changeBlocks,
  onAdoptBlock,
}: RichDiffViewerProps) {
  const [visibleItemsCount, setVisibleItemsCount] = useState(() => initialVisibleItems)

  useEffect(() => {
    setVisibleItemsCount(initialVisibleItems)
  }, [initialVisibleItems, items.length, keyPrefix, layout])

  const shouldRenderAllItems =
    (searchMatchIds?.size ?? 0) > 0 || (navMatchIds?.size ?? 0) > 0
  const renderedItems = useMemo(() => {
    if (shouldRenderAllItems) {
      return items
    }
    return items.slice(0, visibleItemsCount)
  }, [items, shouldRenderAllItems, visibleItemsCount])
  const hasMoreItems = !shouldRenderAllItems && renderedItems.length < items.length
  const blocksByStart = useMemo(() => {
    if (!changeBlocks || changeBlocks.length === 0) {
      return undefined
    }
    const map = new Map<number, TextChangeBlock>()
    for (const block of changeBlocks) {
      map.set(block.startItemIndex, block)
    }
    return map
  }, [changeBlocks])

  return layout === 'split'
    ? (
        <>
          {renderSplitRows({
            items: renderedItems,
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
          })}
          {hasMoreItems ? (
            <div className="result-load-more">
              <button
                type="button"
                className="button-secondary button-compact"
                onClick={() => setVisibleItemsCount((prev) => prev + initialVisibleItems)}
              >
                Show more ({items.length - renderedItems.length} remaining)
              </button>
            </div>
          ) : null}
        </>
      )
    : (
        <>
          {renderUnifiedRows({
            items: renderedItems,
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
          })}
          {hasMoreItems ? (
            <div className="result-load-more">
              <button
                type="button"
                className="button-secondary button-compact"
                onClick={() => setVisibleItemsCount((prev) => prev + initialVisibleItems)}
              >
                Show more ({items.length - renderedItems.length} remaining)
              </button>
            </div>
          ) : null}
        </>
      )
}

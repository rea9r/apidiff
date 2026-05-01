import type { MutableRefObject } from 'react'
import { Tooltip } from '@mantine/core'
import { IconChevronsDown, IconChevronsUp } from '@tabler/icons-react'
import type { TextChangeBlock, UnifiedDiffRow } from '../features/text/textDiff'

type AdoptDirection = 'to-new' | 'to-old'

export type AdoptBlockHandler = (block: TextChangeBlock, direction: AdoptDirection) => void

export type SearchRowRefRegistrar = (
  matchId: string,
) => (node: HTMLDivElement | null) => void

type OmittedSectionExpansion = { top: number; bottom: number }

export type OmittedSectionConfig = {
  getExpansion?: (sectionId: string) => OmittedSectionExpansion
  expansionStep?: number
  onExpandTop?: (sectionId: string) => void
  onExpandBottom?: (sectionId: string) => void
  onExpandAll?: (sectionId: string) => void
}

export type SplitHeaderLabels = {
  left: string
  right: string
}

const DEFAULT_OMITTED_EXPANSION: OmittedSectionExpansion = { top: 0, bottom: 0 }
const DEFAULT_OMITTED_EXPANSION_STEP = 20
export const DEFAULT_SPLIT_HEADER_LABELS: SplitHeaderLabels = {
  left: 'Old',
  right: 'New',
}
export const DEFAULT_INITIAL_VISIBLE_ITEMS = 400

export function createSearchRowRefRegistrar(
  rowRefs: MutableRefObject<Record<string, HTMLDivElement | null>>,
): SearchRowRefRegistrar {
  return (matchId: string) => (node: HTMLDivElement | null) => {
    if (node) {
      rowRefs.current[matchId] = node
      return
    }

    delete rowRefs.current[matchId]
  }
}

export function getSearchClassName(
  searchMatchIds: Set<string> | undefined,
  activeMatchId: string | null | undefined,
  matchId: string,
): string {
  if (!searchMatchIds?.has(matchId)) {
    return ''
  }

  return activeMatchId === matchId ? 'active-search-hit' : 'search-hit'
}

export function getNavClassName(
  navMatchIds: Set<string> | undefined,
  activeNavMatchId: string | null | undefined,
  matchId: string,
): string {
  if (!navMatchIds?.has(matchId) || activeNavMatchId !== matchId) {
    return ''
  }

  return 'active-diff-hit'
}

export function combineRowClassNames(...names: string[]): string {
  return names.filter(Boolean).join(' ')
}

export function maybeRegisterSearchRowRef(
  registerSearchRowRef: SearchRowRefRegistrar | undefined,
  searchMatchIds: Set<string> | undefined,
  navMatchIds: Set<string> | undefined,
  matchId: string,
): ((node: HTMLDivElement | null) => void) | undefined {
  if (!registerSearchRowRef) {
    return undefined
  }
  if (!searchMatchIds?.has(matchId) && !navMatchIds?.has(matchId)) {
    return undefined
  }

  return registerSearchRowRef(matchId)
}

type ResolvedOmittedExpansion = {
  expansion: OmittedSectionExpansion
  total: number
  hidden: number
  fullyExpanded: boolean
  step: number
  canExpandTop: boolean
  canExpandBottom: boolean
  hasGranularControls: boolean
}

export function resolveOmittedExpansion(
  config: OmittedSectionConfig | undefined,
  sectionId: string,
  total: number,
): ResolvedOmittedExpansion {
  const step = config?.expansionStep ?? DEFAULT_OMITTED_EXPANSION_STEP
  if (!config?.getExpansion) {
    return {
      expansion: { top: total, bottom: 0 },
      total,
      hidden: 0,
      fullyExpanded: true,
      step,
      canExpandTop: false,
      canExpandBottom: false,
      hasGranularControls: false,
    }
  }
  const raw = config.getExpansion(sectionId) ?? DEFAULT_OMITTED_EXPANSION
  const top = Math.max(0, Math.min(total, raw.top))
  const bottom = Math.max(0, Math.min(total - top, raw.bottom))
  const hidden = Math.max(0, total - top - bottom)
  const fullyExpanded = hidden === 0
  return {
    expansion: { top, bottom },
    total,
    hidden,
    fullyExpanded,
    step,
    canExpandTop: !fullyExpanded && !!config.onExpandTop,
    canExpandBottom: !fullyExpanded && !!config.onExpandBottom,
    hasGranularControls: true,
  }
}

export function renderOmittedBannerContent(
  sectionId: string,
  resolved: ResolvedOmittedExpansion,
  config: OmittedSectionConfig | undefined,
  hunkHeader: string | null,
) {
  const hunkNode = hunkHeader ? (
    <code className="text-omitted-hunk-header">{hunkHeader}</code>
  ) : null

  if (!resolved.hasGranularControls) {
    return (
      <span className="text-omitted-meta">
        {resolved.hidden} unchanged lines
        {hunkNode ? <> · {hunkNode}</> : null}
      </span>
    )
  }

  const aboveStep = Math.min(resolved.step, resolved.hidden)
  const belowStep = Math.min(resolved.step, resolved.hidden)

  return (
    <>
      <div className="text-omitted-actions left">
        {resolved.canExpandTop ? (
          <Tooltip label={`Show ${aboveStep} lines above`} withArrow>
            <button
              type="button"
              className="text-omitted-icon-button"
              aria-label={`Show ${aboveStep} lines above`}
              onClick={() => config?.onExpandTop?.(sectionId)}
            >
              <IconChevronsUp size={14} />
              <span className="text-omitted-icon-label">{aboveStep}</span>
            </button>
          </Tooltip>
        ) : null}
      </div>
      <span className="text-omitted-meta">
        {resolved.hidden} unchanged lines
        {hunkNode ? <> · {hunkNode}</> : null}
      </span>
      <div className="text-omitted-actions right">
        {config?.onExpandAll ? (
          <button
            type="button"
            className="text-omitted-action button-link"
            onClick={() => config.onExpandAll?.(sectionId)}
          >
            Show all
          </button>
        ) : null}
        {resolved.canExpandBottom ? (
          <Tooltip label={`Show ${belowStep} lines below`} withArrow>
            <button
              type="button"
              className="text-omitted-icon-button"
              aria-label={`Show ${belowStep} lines below`}
              onClick={() => config?.onExpandBottom?.(sectionId)}
            >
              <IconChevronsDown size={14} />
              <span className="text-omitted-icon-label">{belowStep}</span>
            </button>
          </Tooltip>
        ) : null}
      </div>
    </>
  )
}

export function renderAdoptFloatingButtons(
  block: TextChangeBlock,
  layout: 'split' | 'unified',
  onAdoptBlock: AdoptBlockHandler,
  keyBase: string,
) {
  const adoptLabel = (direction: AdoptDirection) =>
    direction === 'to-new' ? 'Copy Old to New' : 'Copy New to Old'

  return (
    <div key={`${keyBase}-adopt`} className={`text-diff-adopt-floating ${layout}`}>
      <Tooltip label={adoptLabel('to-old')} withArrow>
        <button
          type="button"
          className="text-diff-adopt-button"
          aria-label={adoptLabel('to-old')}
          onClick={() => onAdoptBlock(block, 'to-old')}
        >
          ←
        </button>
      </Tooltip>
      <Tooltip label={adoptLabel('to-new')} withArrow>
        <button
          type="button"
          className="text-diff-adopt-button"
          aria-label={adoptLabel('to-new')}
          onClick={() => onAdoptBlock(block, 'to-new')}
        >
          →
        </button>
      </Tooltip>
    </div>
  )
}

export function renderInlineDiffContent(row: UnifiedDiffRow, keyBase: string) {
  if (!row.inlineSegments || row.inlineSegments.length === 0) {
    return row.content
  }

  return row.inlineSegments.map((segment, index) => {
    const className =
      segment.kind === 'same'
        ? undefined
        : segment.kind === 'add'
          ? 'text-inline-add'
          : 'text-inline-remove'

    return (
      <span key={`${keyBase}-${index}`} className={className}>
        {segment.text}
      </span>
    )
  })
}

export function renderSplitDiffCell(
  row: UnifiedDiffRow | null,
  side: 'left' | 'right',
  keyBase: string,
  highlightClassName = '',
  rowRef?: (node: HTMLDivElement | null) => void,
) {
  const lineNumber = side === 'left' ? row?.oldLine : row?.newLine
  const kindClass = row?.kind ?? 'empty'

  return (
    <div
      ref={rowRef}
      className={combineRowClassNames('split-diff-cell', kindClass, highlightClassName)}
    >
      <div className="split-diff-line">{lineNumber ?? ''}</div>
      <pre className="split-diff-content">
        {row ? renderInlineDiffContent(row, keyBase) : ''}
      </pre>
    </div>
  )
}

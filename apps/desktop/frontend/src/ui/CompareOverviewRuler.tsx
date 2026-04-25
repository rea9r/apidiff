import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from 'react'

export type OverviewRulerMarkKind = 'add' | 'remove' | 'change'

export type OverviewRulerMark = {
  id: string
  kind: OverviewRulerMarkKind
}

type ResolvedMark = {
  id: string
  kind: OverviewRulerMarkKind
  top: number
  height: number
}

type CompareOverviewRulerProps = {
  containerRef: RefObject<HTMLElement | null>
  resolveNode: (id: string) => HTMLElement | null
  marks: OverviewRulerMark[]
  activeMarkId?: string | null
  onJumpToMark?: (id: string) => void
}

const MIN_MARK_HEIGHT = 3
const MIN_THUMB_HEIGHT = 12
const CLICK_TOLERANCE_PX = 8

function rectOffsetTop(node: HTMLElement, container: HTMLElement): number {
  return (
    node.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop
  )
}

export function CompareOverviewRuler({
  containerRef,
  resolveNode,
  marks,
  activeMarkId,
  onJumpToMark,
}: CompareOverviewRulerProps) {
  const rulerRef = useRef<HTMLDivElement | null>(null)
  const [resolvedMarks, setResolvedMarks] = useState<ResolvedMark[]>([])
  const [thumb, setThumb] = useState<{ top: number; height: number }>({ top: 0, height: 0 })
  const [hasOverflow, setHasOverflow] = useState(false)

  const recomputeMarks = useCallback(() => {
    const container = containerRef.current
    const ruler = rulerRef.current
    if (!container || !ruler) {
      return
    }

    const rulerHeight = ruler.clientHeight
    const scrollHeight = Math.max(container.scrollHeight, 1)

    const next: ResolvedMark[] = []
    for (const mark of marks) {
      const node = resolveNode(mark.id)
      if (!node) {
        continue
      }
      const offsetTop = rectOffsetTop(node, container)
      const top = (offsetTop / scrollHeight) * rulerHeight
      const rawHeight = (node.offsetHeight / scrollHeight) * rulerHeight
      const height = Math.max(MIN_MARK_HEIGHT, rawHeight)
      next.push({ id: mark.id, kind: mark.kind, top, height })
    }
    setResolvedMarks(next)
  }, [containerRef, resolveNode, marks])

  const recomputeThumb = useCallback(() => {
    const container = containerRef.current
    const ruler = rulerRef.current
    if (!container || !ruler) {
      return
    }

    const rulerHeight = ruler.clientHeight
    const scrollHeight = Math.max(container.scrollHeight, 1)
    const overflow = container.scrollHeight - container.clientHeight > 1
    setHasOverflow(overflow)

    const top = (container.scrollTop / scrollHeight) * rulerHeight
    const rawHeight = (container.clientHeight / scrollHeight) * rulerHeight
    const height = Math.max(MIN_THUMB_HEIGHT, rawHeight)
    setThumb({ top, height })
  }, [containerRef])

  const recomputeAll = useCallback(() => {
    recomputeMarks()
    recomputeThumb()
  }, [recomputeMarks, recomputeThumb])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let frame = 0
    const scheduleAll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(recomputeAll)
    }

    const onScroll = () => {
      recomputeThumb()
    }

    container.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver(scheduleAll)
    ro.observe(container)
    if (rulerRef.current) {
      ro.observe(rulerRef.current)
    }

    scheduleAll()

    return () => {
      container.removeEventListener('scroll', onScroll)
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [containerRef, recomputeAll, recomputeThumb])

  useEffect(() => {
    const frame = requestAnimationFrame(recomputeAll)
    return () => cancelAnimationFrame(frame)
  }, [marks, recomputeAll])

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current
      const ruler = rulerRef.current
      if (!container || !ruler) {
        return
      }

      const rect = ruler.getBoundingClientRect()
      const clickY = event.clientY - rect.top
      const rulerHeight = rect.height || 1

      let nearest: ResolvedMark | null = null
      let nearestDistance = Number.POSITIVE_INFINITY
      for (const mark of resolvedMarks) {
        const center = mark.top + mark.height / 2
        const distance = Math.abs(center - clickY)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = mark
        }
      }

      if (nearest && nearestDistance <= CLICK_TOLERANCE_PX && onJumpToMark) {
        onJumpToMark(nearest.id)
        return
      }

      const ratio = clickY / rulerHeight
      const targetScrollTop =
        ratio * container.scrollHeight - container.clientHeight / 2
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'auto',
      })
    },
    [containerRef, onJumpToMark, resolvedMarks],
  )

  const ariaLabel = useMemo(() => `Diff overview, ${marks.length} marks`, [marks.length])

  if (marks.length === 0) {
    return null
  }

  return (
    <div
      ref={rulerRef}
      className="compare-overview-ruler"
      role="presentation"
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {hasOverflow ? (
        <div
          className="compare-overview-ruler-thumb"
          style={
            {
              top: `${thumb.top}px`,
              height: `${thumb.height}px`,
            } as CSSProperties
          }
        />
      ) : null}
      {resolvedMarks.map((mark) => (
        <div
          key={mark.id}
          className={`compare-overview-ruler-mark ${mark.kind}${
            activeMarkId === mark.id ? ' active' : ''
          }`}
          style={
            {
              top: `${mark.top}px`,
              height: `${mark.height}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

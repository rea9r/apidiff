import type { CSSProperties, ReactNode } from 'react'
import { useDragResizeHeight } from '../useDragResizeHeight'

const DEFAULT_INPUT_HEIGHT = 320

type DiffSourceGridProps = {
  left: ReactNode
  right: ReactNode
  className?: string
  resizeKey: string
}

export function DiffSourceGrid({ left, right, className, resizeKey }: DiffSourceGridProps) {
  const gridClassName = ['diff-source-grid-shared', className].filter(Boolean).join(' ')
  const storageKey = `xdiff.desktop.inputPaneHeight.${resizeKey}`
  const { height, onPointerDown } = useDragResizeHeight(storageKey, DEFAULT_INPUT_HEIGHT)

  const style = { '--xdiff-input-pane-height': `${height}px` } as CSSProperties

  return (
    <div className="diff-source-grid-wrap" style={style}>
      <div className={gridClassName}>
        {left}
        {right}
      </div>
      <div
        className="diff-source-grid-resizer"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize input panes"
        onPointerDown={onPointerDown}
      />
    </div>
  )
}

import type { ReactNode } from 'react'
import { ComparePathSlot } from './ComparePathSlot'

type CompareSourcePaneProps = {
  title: string
  sourcePath?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function CompareSourcePane({
  title,
  sourcePath,
  actions,
  children,
  className,
}: CompareSourcePaneProps) {
  const paneClassName = ['compare-source-pane', className].filter(Boolean).join(' ')

  return (
    <div className={paneClassName}>
      <div className="compare-source-pane-header">
        <div className="compare-source-pane-title">
          <label className="field-label">{title}</label>
          <ComparePathSlot path={sourcePath} />
        </div>
        {actions ? <div className="compare-source-pane-actions">{actions}</div> : null}
      </div>

      <div className="compare-source-pane-body">{children}</div>
    </div>
  )
}

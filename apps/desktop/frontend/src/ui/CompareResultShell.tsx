import type { ReactNode, RefObject } from 'react'
import { CompareStatusState } from './CompareStatusState'

type CompareResultShellProps = {
  toolbar: ReactNode
  summary?: ReactNode
  hasResult: boolean
  emptyState?: ReactNode
  children: ReactNode
  className?: string
  aside?: ReactNode
  bodyRef?: RefObject<HTMLDivElement>
}

export function CompareResultShell({
  toolbar,
  summary,
  hasResult,
  emptyState,
  children,
  className,
  aside,
  bodyRef,
}: CompareResultShellProps) {
  const shellClassName = ['compare-result-shell', className].filter(Boolean).join(' ')
  const body = (
    <div className="compare-result-body" ref={bodyRef}>
      {hasResult ? children : emptyState ?? <CompareStatusState kind="empty" />}
    </div>
  )

  return (
    <div className={shellClassName}>
      {toolbar}
      {summary}
      {aside ? (
        <div className="compare-result-frame">
          {body}
          {aside}
        </div>
      ) : (
        body
      )}
    </div>
  )
}

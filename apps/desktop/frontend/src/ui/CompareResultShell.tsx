import type { ReactNode } from 'react'

type CompareResultShellProps = {
  toolbar: ReactNode
  hasResult: boolean
  emptyState?: ReactNode
  children: ReactNode
}

export function CompareResultShell({
  toolbar,
  hasResult,
  emptyState,
  children,
}: CompareResultShellProps) {
  return (
    <div className="compare-result-shell">
      {toolbar}
      <div className="compare-result-body">
        {hasResult ? children : emptyState ?? <pre className="result-output">(no result yet)</pre>}
      </div>
    </div>
  )
}

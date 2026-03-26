import type { ReactNode } from 'react'

type CompareWorkspaceShellProps = {
  source: ReactNode
  result: ReactNode
  className?: string
}

export function CompareWorkspaceShell({
  source,
  result,
  className,
}: CompareWorkspaceShellProps) {
  const shellClassName = ['compare-workspace-shell', className].filter(Boolean).join(' ')

  return (
    <div className={shellClassName}>
      <div className="compare-workspace-source">{source}</div>
      <div className="compare-workspace-result">{result}</div>
    </div>
  )
}

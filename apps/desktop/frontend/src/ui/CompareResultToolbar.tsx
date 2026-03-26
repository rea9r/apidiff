import type { ReactNode } from 'react'

type CompareResultToolbarProps = {
  primary: ReactNode
  summary?: ReactNode
  secondary?: ReactNode
}

export function CompareResultToolbar({
  primary,
  summary,
  secondary,
}: CompareResultToolbarProps) {
  return (
    <div className="compare-result-toolbar">
      <div className="compare-result-primary">
        {primary}
        {summary}
      </div>
      {secondary ? <div className="compare-result-secondary">{secondary}</div> : null}
    </div>
  )
}

import type { ReactNode } from 'react'

type CompareSourceGridProps = {
  left: ReactNode
  right: ReactNode
  className?: string
}

export function CompareSourceGrid({ left, right, className }: CompareSourceGridProps) {
  const gridClassName = ['compare-source-grid-shared', className].filter(Boolean).join(' ')

  return (
    <div className={gridClassName}>
      {left}
      {right}
    </div>
  )
}

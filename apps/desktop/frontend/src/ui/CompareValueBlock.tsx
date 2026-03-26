import type { ReactNode } from 'react'

type CompareValueBlockProps = {
  inline?: boolean
  expanded?: boolean
  children: ReactNode
}

export function CompareValueBlock({ inline = false, expanded = false, children }: CompareValueBlockProps) {
  if (inline) {
    return <code className="compare-value-inline">{children}</code>
  }

  return (
    <pre className={`compare-value-block ${expanded ? 'is-expanded' : ''}`}>
      {children}
    </pre>
  )
}

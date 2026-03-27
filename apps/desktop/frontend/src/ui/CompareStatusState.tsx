import type { ReactNode } from 'react'

type CompareStatusStateProps = {
  kind: 'empty' | 'success-empty' | 'error'
  children?: ReactNode
}

const defaultMessageByKind: Record<CompareStatusStateProps['kind'], string> = {
  empty: '(no result yet)',
  'success-empty': 'No differences',
  error: 'Execution error',
}

export function CompareStatusState({ kind, children }: CompareStatusStateProps) {
  const content = children ?? defaultMessageByKind[kind]
  return <div className={`compare-status-state ${kind}`}>{content}</div>
}

import type { ReactNode } from 'react'
import { CompareSectionHeader } from './CompareSectionHeader'

type SpecDiffSectionProps = {
  groupKey: string
  itemCount: number
  collapsed: boolean
  onToggle: () => void
  badges?: ReactNode
}

export function SpecDiffSection({
  groupKey,
  itemCount,
  collapsed,
  onToggle,
  badges,
}: SpecDiffSectionProps) {
  return (
    <CompareSectionHeader
      title={groupKey}
      countLabel={`${itemCount} changes`}
      collapsed={collapsed}
      onToggle={onToggle}
      badges={badges}
    />
  )
}

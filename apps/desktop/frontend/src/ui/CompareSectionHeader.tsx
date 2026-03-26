import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import type { ReactNode } from 'react'

type CompareSectionHeaderProps = {
  title: ReactNode
  countLabel?: string
  badges?: ReactNode
  collapsed?: boolean
  onToggle?: () => void
  actions?: ReactNode
}

export function CompareSectionHeader({
  title,
  countLabel,
  badges,
  collapsed = false,
  onToggle,
  actions,
}: CompareSectionHeaderProps) {
  const Content = (
    <>
      <span className="compare-section-header-left">
        {onToggle ? (
          collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />
        ) : null}
        <span className="compare-section-title">{title}</span>
        {countLabel ? <span className="compare-section-count">{countLabel}</span> : null}
      </span>
      <span className="compare-section-header-right">
        {badges}
        {actions}
      </span>
    </>
  )

  if (onToggle) {
    return (
      <button type="button" className="compare-section-header" onClick={onToggle}>
        {Content}
      </button>
    )
  }

  return <div className="compare-section-header">{Content}</div>
}

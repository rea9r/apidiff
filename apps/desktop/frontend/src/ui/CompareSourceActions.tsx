import { ActionIcon, Tooltip } from '@mantine/core'
import type { ReactNode } from 'react'

export const COMPARE_PANE_ACTION_SIZE = 26

type ComparePaneActionProps = {
  label: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  danger?: boolean
  children: ReactNode
}

type ComparePaneActionsProps = {
  children: ReactNode
}

export function ComparePaneActions({ children }: ComparePaneActionsProps) {
  return <div className="compare-pane-actions">{children}</div>
}

export function ComparePaneAction({
  label,
  onClick,
  disabled,
  loading,
  danger = false,
  children,
}: ComparePaneActionProps) {
  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="default"
        size={COMPARE_PANE_ACTION_SIZE}
        aria-label={label}
        className={`compare-pane-action ${danger ? 'is-danger' : ''}`}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  )
}

import { IconArrowsDiff } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { HeaderRailGroup, HeaderRailPrimaryButton } from './HeaderRail'

type DiffModeHeaderActionsProps = {
  loading?: boolean
  diffDisabled?: boolean
  onDiff: () => void
  extraActions?: ReactNode
}

export function DiffModeHeaderActions({
  loading = false,
  diffDisabled = false,
  onDiff,
  extraActions,
}: DiffModeHeaderActionsProps) {
  return (
    <HeaderRailGroup className="diff-mode-header-actions">
      <HeaderRailPrimaryButton
        onClick={onDiff}
        loading={loading}
        disabled={diffDisabled}
        leftSection={<IconArrowsDiff size={14} />}
      >
        Compare
      </HeaderRailPrimaryButton>
      {extraActions}
    </HeaderRailGroup>
  )
}

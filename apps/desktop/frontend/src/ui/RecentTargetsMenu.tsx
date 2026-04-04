import { Menu, Tooltip } from '@mantine/core'
import { IconHistory } from '@tabler/icons-react'
import { HeaderRailAction } from './HeaderRail'

export type RecentTargetsMenuItem = {
  key: string
  label: string
  onClick: () => void
}

type RecentTargetsMenuProps = {
  buttonLabel: string
  disabled?: boolean
  items: RecentTargetsMenuItem[]
  clearLabel?: string
  onClear: () => void
}

export function RecentTargetsMenu({
  buttonLabel,
  disabled = false,
  items,
  clearLabel = 'Clear recent',
  onClear,
}: RecentTargetsMenuProps) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Tooltip label={buttonLabel}>
          <HeaderRailAction aria-label={buttonLabel} disabled={disabled}>
            <IconHistory size={14} />
          </HeaderRailAction>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {items.map((item) => (
          <Menu.Item key={item.key} onClick={item.onClick}>
            {item.label}
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item color="red" onClick={onClear}>
          {clearLabel}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

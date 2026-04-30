import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { IconAdjustmentsHorizontal, IconCheck } from '@tabler/icons-react'
import type { ReactNode } from 'react'

type ViewSettingsItem = {
  key: string
  label: string
  active: boolean
  disabled?: boolean
  closeMenuOnClick?: boolean
  onSelect: () => void
}

type ViewSettingsSection = {
  title: string
  items: ViewSettingsItem[]
}

type ViewSettingsMenuProps = {
  tooltip: string
  sections: ViewSettingsSection[]
  footer?: ReactNode
}

function renderMenuCheck(active: boolean) {
  return active ? (
    <IconCheck size={14} className="menu-check-icon is-active" />
  ) : (
    <span className="menu-check-slot" aria-hidden="true" />
  )
}

export function ViewSettingsMenu({ tooltip, sections, footer }: ViewSettingsMenuProps) {
  const visibleSections = sections.filter((section) => section.items.length > 0)

  return (
    <Menu position="bottom-end" withinPortal closeOnItemClick={false}>
      <Menu.Target>
        <Tooltip label={tooltip}>
          <ActionIcon
            variant="default"
            size={28}
            aria-label={tooltip}
            className="text-result-action"
          >
            <IconAdjustmentsHorizontal size={15} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        {visibleSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {sectionIndex > 0 ? <Menu.Divider /> : null}
            <Menu.Label>{section.title}</Menu.Label>
            {section.items.map((item) => (
              <Menu.Item
                key={item.key}
                leftSection={renderMenuCheck(item.active)}
                onClick={item.onSelect}
                disabled={item.disabled}
                closeMenuOnClick={item.closeMenuOnClick}
              >
                {item.label}
              </Menu.Item>
            ))}
          </div>
        ))}
        {footer ? (
          <>
            {visibleSections.length > 0 ? <Menu.Divider /> : null}
            <div className="view-settings-menu-footer">{footer}</div>
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  )
}

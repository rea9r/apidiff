import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { IconAdjustmentsHorizontal, IconCheck } from '@tabler/icons-react'

type ViewSettingsItem = {
  key: string
  label: string
  active: boolean
  disabled?: boolean
  onSelect: () => void
}

type ViewSettingsSection = {
  title: string
  items: ViewSettingsItem[]
}

type ViewSettingsMenuProps = {
  tooltip: string
  sections: ViewSettingsSection[]
}

function renderMenuCheck(active: boolean) {
  return active ? (
    <IconCheck size={14} className="menu-check-icon is-active" />
  ) : (
    <span className="menu-check-slot" aria-hidden="true" />
  )
}

export function ViewSettingsMenu({ tooltip, sections }: ViewSettingsMenuProps) {
  const visibleSections = sections.filter((section) => section.items.length > 0)

  return (
    <Menu position="bottom-end" withinPortal>
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
              >
                {item.label}
              </Menu.Item>
            ))}
          </div>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

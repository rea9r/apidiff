import { Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import {
  HEADER_RAIL_ICON_SIZE,
  HeaderRailGroup,
  HeaderRailToggleIcon,
} from './HeaderRail'

export function ThemeModeControl() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <HeaderRailGroup className="xdiff-theme-toggle-group">
      <Tooltip label="Follow system theme">
        <div>
          <HeaderRailToggleIcon
            active={colorScheme === 'auto'}
            onClick={() => setColorScheme('auto')}
            label="Follow system theme"
            activeVariant="light"
            activeColor="gray"
          >
            <IconDeviceDesktop size={HEADER_RAIL_ICON_SIZE} />
          </HeaderRailToggleIcon>
        </div>
      </Tooltip>

      <Tooltip label="Light theme">
        <div>
          <HeaderRailToggleIcon
            active={colorScheme === 'light'}
            onClick={() => setColorScheme('light')}
            label="Light theme"
            activeVariant="light"
            activeColor="gray"
          >
            <IconSun size={HEADER_RAIL_ICON_SIZE} />
          </HeaderRailToggleIcon>
        </div>
      </Tooltip>

      <Tooltip label="Dark theme">
        <div>
          <HeaderRailToggleIcon
            active={colorScheme === 'dark'}
            onClick={() => setColorScheme('dark')}
            label="Dark theme"
            activeVariant="light"
            activeColor="gray"
          >
            <IconMoon size={HEADER_RAIL_ICON_SIZE} />
          </HeaderRailToggleIcon>
        </div>
      </Tooltip>
    </HeaderRailGroup>
  )
}

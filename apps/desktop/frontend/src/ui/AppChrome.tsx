import { AppShell, Box, Group, Select, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import type { Mode } from '../types'
import { ThemeModeControl } from './ThemeModeControl'

type AppChromeProps = {
  mode: Mode
  onModeChange: (mode: Mode) => void
  sidebar: ReactNode
  main: ReactNode
}

const MODE_OPTIONS = [
  { value: 'json', label: 'JSON compare' },
  { value: 'spec', label: 'OpenAPI spec compare' },
  { value: 'text', label: 'Text compare' },
  { value: 'folder', label: 'Folder compare' },
  { value: 'scenario', label: 'Scenario run' },
]

export function AppChrome({ mode, onModeChange, sidebar, main }: AppChromeProps) {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 360, breakpoint: 'sm' }} padding="md">
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group gap="md">
            <Text fw={700}>xdiff Desktop</Text>
            <Select
              w={220}
              data={MODE_OPTIONS}
              value={mode}
              onChange={(value) => value && onModeChange(value as Mode)}
            />
          </Group>
          <ThemeModeControl />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Box className="control-panel">{sidebar}</Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box className="result-panel">{main}</Box>
      </AppShell.Main>
    </AppShell>
  )
}

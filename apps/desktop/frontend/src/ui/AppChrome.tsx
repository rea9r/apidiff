import { AppShell, Box, Burger, Group, ScrollArea, Select, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
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

const NAVBAR_WIDTH_STORAGE_KEY = 'xdiff.desktop.navbarWidth'
const DEFAULT_NAVBAR_WIDTH = 320
const MIN_NAVBAR_WIDTH = 280
const MAX_NAVBAR_WIDTH = 460

function clampNavbarWidth(width: number): number {
  return Math.max(MIN_NAVBAR_WIDTH, Math.min(MAX_NAVBAR_WIDTH, width))
}

export function AppChrome({ mode, onModeChange, sidebar, main }: AppChromeProps) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)
  const [navbarWidth, setNavbarWidth] = useState(DEFAULT_NAVBAR_WIDTH)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(DEFAULT_NAVBAR_WIDTH)
  const isResizingRef = useRef(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(NAVBAR_WIDTH_STORAGE_KEY)
    if (!raw) {
      return
    }

    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed)) {
      setNavbarWidth(clampNavbarWidth(parsed))
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(NAVBAR_WIDTH_STORAGE_KEY, String(navbarWidth))
  }, [navbarWidth])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current) {
        return
      }

      const delta = event.clientX - resizeStartXRef.current
      setNavbarWidth(clampNavbarWidth(resizeStartWidthRef.current + delta))
    }

    const onPointerUp = () => {
      if (!isResizingRef.current) {
        return
      }

      isResizingRef.current = false
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    isResizingRef.current = true
    resizeStartXRef.current = event.clientX
    resizeStartWidthRef.current = navbarWidth
  }

  const resetNavbarWidth = () => {
    setNavbarWidth(DEFAULT_NAVBAR_WIDTH)
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: navbarWidth,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group gap="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <Text fw={700}>xdiff Desktop</Text>
            <Select
              w={200}
              data={MODE_OPTIONS}
              value={mode}
              onChange={(value) => {
                if (!value) {
                  return
                }
                onModeChange(value as Mode)
                closeMobile()
              }}
            />
          </Group>
          <ThemeModeControl />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Box pr="xs" className="control-panel">
            {sidebar}
          </Box>
        </AppShell.Section>
        <div
          className="app-navbar-resizer"
          onPointerDown={startResize}
          onDoubleClick={resetNavbarWidth}
          aria-hidden="true"
        />
      </AppShell.Navbar>

      <AppShell.Main>{main}</AppShell.Main>
    </AppShell>
  )
}

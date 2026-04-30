import { AppShell, Box, Burger, Group, ScrollArea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconCheck } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { Mode } from '../types'
import { WindowToggleMaximise } from '../../wailsjs/runtime/runtime'
import { CodeFontScaleControl } from './CodeFontScaleControl'
import { HeaderRailGroup, HeaderRailSelect } from './HeaderRail'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { ThemeModeControl } from './ThemeModeControl'

type AppChromeLayoutMode = 'workspace' | 'sidebar'

type AppChromeProps = {
  mode: Mode
  onModeChange: (mode: Mode) => void
  layoutMode: AppChromeLayoutMode
  sidebar?: ReactNode
  main: ReactNode
  headerActions?: ReactNode
  tabBar?: ReactNode
}

const MODE_OPTIONS = [
  {
    group: 'Diff',
    items: [
      { value: 'text', label: 'Text diff' },
      { value: 'json', label: 'JSON diff' },
      { value: 'directory', label: 'Directory diff' },
    ],
  },
]

const NAVBAR_WIDTH_STORAGE_KEY = 'xdiff.desktop.navbarWidth'
const DEFAULT_NAVBAR_WIDTH = 320
const MIN_NAVBAR_WIDTH = 280
const MAX_NAVBAR_WIDTH = 460

const IS_MACOS =
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent)

function clampNavbarWidth(width: number): number {
  return Math.max(MIN_NAVBAR_WIDTH, Math.min(MAX_NAVBAR_WIDTH, width))
}

export function AppChrome({
  mode,
  onModeChange,
  layoutMode,
  sidebar,
  main,
  headerActions,
  tabBar,
}: AppChromeProps) {
  const isSidebarLayout = layoutMode === 'sidebar'
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)
  const [navbarWidth, setNavbarWidth] = useState(DEFAULT_NAVBAR_WIDTH)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(DEFAULT_NAVBAR_WIDTH)
  const isResizingRef = useRef(false)

  useEffect(() => {
    if (!isSidebarLayout) {
      return
    }

    const raw = window.localStorage.getItem(NAVBAR_WIDTH_STORAGE_KEY)
    if (!raw) {
      return
    }

    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed)) {
      setNavbarWidth(clampNavbarWidth(parsed))
    }
  }, [isSidebarLayout])

  useEffect(() => {
    if (!isSidebarLayout) {
      return
    }

    window.localStorage.setItem(NAVBAR_WIDTH_STORAGE_KEY, String(navbarWidth))
  }, [isSidebarLayout, navbarWidth])

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

  // macOS uses TitleBarHidden, so double-clicking the title bar doesn't trigger
  // the OS zoom behavior. Restore it manually for clicks on the drag region only
  // (interactive children are marked no-drag and shouldn't toggle the window).
  const isHeaderDragSurface = (target: HTMLElement | null): boolean => {
    if (!IS_MACOS || !target) {
      return false
    }
    return !target.closest(
      'button, input, select, textarea, a[href], [role="combobox"], [role="button"], [role="slider"]',
    )
  }

  // Suppress the browser's default "select word" behavior on the second mousedown
  // of a double-click — without this, double-clicking the drag region selects text
  // in whatever content sits below the header.
  const handleHeaderMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.detail < 2) {
      return
    }
    if (!isHeaderDragSurface(event.target as HTMLElement | null)) {
      return
    }
    event.preventDefault()
  }

  const handleHeaderDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isHeaderDragSurface(event.target as HTMLElement | null)) {
      return
    }
    WindowToggleMaximise()
  }

  return (
    <AppShell
      header={{ height: 36 }}
      navbar={
        isSidebarLayout
          ? {
            width: navbarWidth,
            breakpoint: 'md',
            collapsed: { mobile: !mobileOpened },
          }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header
        className={IS_MACOS ? 'xdiff-app-header is-macos' : 'xdiff-app-header'}
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={handleHeaderDoubleClick}
      >
        <Group justify="space-between" h="100%" px="md">
          <HeaderRailGroup>
            {isSidebarLayout ? (
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="md"
                size="sm"
                className="xdiff-header-burger"
                aria-label="Toggle navigation"
              />
            ) : null}
            <HeaderRailSelect
              w={145}
              className="xdiff-header-mode-select"
              data={MODE_OPTIONS}
              withCheckIcon={false}
              renderOption={({ option, checked }: { option: { label: string }; checked: boolean }) => (
                <div className="mode-option-row">
                  <span className="mode-option-check-slot" aria-hidden="true">
                    {checked ? <IconCheck size={14} className="mode-option-check-icon" /> : null}
                  </span>
                  <span className="mode-option-label">{option.label}</span>
                </div>
              )}
              value={mode}
              onChange={(value: string | null) => {
                if (!value) {
                  return
                }
                onModeChange(value as Mode)
                if (isSidebarLayout) {
                  closeMobile()
                }
              }}
            />
          </HeaderRailGroup>
          <HeaderRailGroup>
            {headerActions}
            <CodeFontScaleControl />
            <ThemeModeControl />
          </HeaderRailGroup>
        </Group>
      </AppShell.Header>

      {isSidebarLayout ? (
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
      ) : null}

      <AppShell.Main>
        {tabBar}
        {isSidebarLayout ? main : <div className="workspace-shell">{main}</div>}
      </AppShell.Main>

      <KeyboardShortcutsHelp />
    </AppShell>
  )
}

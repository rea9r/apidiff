import { useEffect, useRef } from 'react'
import type { DesktopTabsManagerState } from './useDesktopTabsManager'

type DesktopTabHotkeyOverrides = {
  closeTab?: (id: string) => void
}

export function useDesktopTabHotkeys(
  tabsManager: DesktopTabsManagerState,
  overrides?: DesktopTabHotkeyOverrides,
) {
  const managerRef = useRef(tabsManager)
  managerRef.current = tabsManager
  const overridesRef = useRef(overrides)
  overridesRef.current = overrides

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const ctrlOrCmd = event.ctrlKey || event.metaKey
      if (!ctrlOrCmd || event.altKey || event.shiftKey) {
        return
      }

      const m = managerRef.current
      const o = overridesRef.current
      const key = event.key.toLowerCase()

      if (key === 't') {
        event.preventDefault()
        m.addTab()
        return
      }

      if (key === 'w') {
        event.preventDefault()
        const close = o?.closeTab ?? m.closeTab
        close(m.activeTabId)
        return
      }

      if (/^[1-9]$/.test(event.key)) {
        const n = Number(event.key)
        const target = n === 9 ? m.tabs[m.tabs.length - 1] : m.tabs[n - 1]
        if (target) {
          event.preventDefault()
          m.setActiveTabId(target.id)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}

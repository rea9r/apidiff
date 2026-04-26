import { useCallback, useEffect, useRef, useState } from 'react'

export type DesktopTab = {
  id: string
  label: string
}

const INITIAL_TAB_ID = 'tab-1'
const INITIAL_TAB: DesktopTab = { id: INITIAL_TAB_ID, label: 'Tab 1' }

export function useDesktopTabsManager() {
  const [tabs, setTabs] = useState<DesktopTab[]>([INITIAL_TAB])
  const [activeTabId, setActiveTabId] = useState<string>(INITIAL_TAB_ID)
  const counterRef = useRef<number>(1)

  const addTab = useCallback(() => {
    counterRef.current += 1
    const next = counterRef.current
    const id = `tab-${next}-${Date.now()}`
    const newTab: DesktopTab = { id, label: `Tab ${next}` }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(id)
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)))
  }, [])

  const updateTabLabel = useCallback((id: string, label: string) => {
    setTabs((prev) => {
      const target = prev.find((t) => t.id === id)
      if (!target || target.label === label) {
        return prev
      }
      return prev.map((t) => (t.id === id ? { ...t, label } : t))
    })
  }, [])

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id)
    }
  }, [tabs, activeTabId])

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    addTab,
    closeTab,
    updateTabLabel,
    initialTabId: INITIAL_TAB_ID,
  }
}

export type DesktopTabsManagerState = ReturnType<typeof useDesktopTabsManager>

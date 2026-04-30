import './style.css'
import { useMemo, useRef } from 'react'
import { AppChrome } from './ui/AppChrome'
import { TabBar } from './ui/TabBar'
import { DesktopTabSurface } from './DesktopTabSurface'
import {
  DesktopTabSlotsProvider,
  useActiveDesktopTabSlots,
} from './useDesktopTabSlotsContext'
import { useDesktopBridge } from './useDesktopBridge'
import { useDesktopRecentPairs } from './useDesktopRecentPairs'
import {
  useDesktopTabsManager,
  type DesktopTabsManagerState,
} from './useDesktopTabsManager'
import { useDesktopStatePersistor } from './useDesktopStatePersistor'
import { useDesktopTabHotkeys } from './useDesktopTabHotkeys'
import { DesktopTabDirtyProvider } from './useDesktopTabDirtyRegistry'
import { useTabCloseConfirm } from './useTabCloseConfirm'
import { useGuardedTabClose, type GuardedTabClose } from './useGuardedTabClose'
import type { DesktopState, DesktopTabSession } from './types'

export function App() {
  const api = useDesktopBridge()
  const persistor = useDesktopStatePersistor({ api })

  if (!persistor.hydrated || !persistor.snapshot) {
    return null
  }

  return <AppHydrated api={api} persistor={persistor} initial={persistor.snapshot} />
}

type AppHydratedProps = {
  api: ReturnType<typeof useDesktopBridge>
  persistor: ReturnType<typeof useDesktopStatePersistor>
  initial: DesktopState
}

function AppHydrated(props: AppHydratedProps) {
  return (
    <DesktopTabDirtyProvider>
      <AppHydratedInner {...props} />
    </DesktopTabDirtyProvider>
  )
}

function AppHydratedInner({ api, persistor, initial }: AppHydratedProps) {
  const recentPairs = useDesktopRecentPairs({ initial, commit: persistor.commit })
  const tabsManager = useDesktopTabsManager({
    initial,
    commit: persistor.commit,
    fallbackTabSession: persistor.fallbackTabSession,
  })
  const { confirm, modal } = useTabCloseConfirm()
  const guardedClose = useGuardedTabClose(tabsManager, confirm)
  useDesktopTabHotkeys(tabsManager, { closeTab: guardedClose.closeTab })

  const initialSessionsById = useMemo(() => {
    const map = new Map<string, DesktopTabSession>()
    for (const session of initial.tabs) {
      map.set(session.id, session)
    }
    return map
  }, [initial])

  const initialSessionCacheRef = useRef<Map<string, DesktopTabSession>>(new Map())
  const resolveInitialSession = (tab: { id: string; label: string }): DesktopTabSession => {
    const cached = initialSessionCacheRef.current.get(tab.id)
    if (cached) return cached
    const session =
      initialSessionsById.get(tab.id) ??
      persistor.getLatestSession(tab.id) ??
      persistor.fallbackTabSession(tab.id, tab.label)
    initialSessionCacheRef.current.set(tab.id, session)
    return session
  }

  return (
    <>
      <DesktopTabSlotsProvider>
        <ActiveTabAppChrome tabsManager={tabsManager} guardedClose={guardedClose} />
        {tabsManager.tabs.map((tab) => (
          <DesktopTabSurface
            key={tab.id}
            tabId={tab.id}
            isActive={tab.id === tabsManager.activeTabId}
            api={api}
            recentPairs={recentPairs}
            onLabelChange={tabsManager.updateTabLabel}
            initialSession={resolveInitialSession(tab)}
            commit={persistor.commit}
          />
        ))}
      </DesktopTabSlotsProvider>
      {modal}
    </>
  )
}

type ActiveTabAppChromeProps = {
  tabsManager: DesktopTabsManagerState
  guardedClose: GuardedTabClose
}

function ActiveTabAppChrome({ tabsManager, guardedClose }: ActiveTabAppChromeProps) {
  const slots = useActiveDesktopTabSlots()
  const { tabs, activeTabId, setActiveTabId, addTab, reorderTab } = tabsManager

  if (!slots) {
    return null
  }

  return (
    <AppChrome
      mode={slots.mode}
      onModeChange={slots.onModeChange}
      layoutMode={slots.layoutMode}
      sidebar={slots.sidebar}
      headerActions={slots.headerActions}
      main={slots.main}
      tabBar={
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onAddTab={addTab}
          onCloseTab={guardedClose.closeTab}
          onCloseOthers={guardedClose.closeOthers}
          onCloseToRight={guardedClose.closeToRight}
          onCloseAll={guardedClose.closeAll}
          onReorderTab={reorderTab}
        />
      }
    />
  )
}

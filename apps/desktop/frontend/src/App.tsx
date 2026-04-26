import './style.css'
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

export function App() {
  const api = useDesktopBridge()
  const recentPairs = useDesktopRecentPairs()
  const tabsManager = useDesktopTabsManager()

  return (
    <DesktopTabSlotsProvider>
      <ActiveTabAppChrome tabsManager={tabsManager} />
      {tabsManager.tabs.map((tab) => (
        <DesktopTabSurface
          key={tab.id}
          tabId={tab.id}
          isActive={tab.id === tabsManager.activeTabId}
          isInitialTab={tab.id === tabsManager.initialTabId}
          api={api}
          recentPairs={recentPairs}
          onLabelChange={tabsManager.updateTabLabel}
        />
      ))}
    </DesktopTabSlotsProvider>
  )
}

function ActiveTabAppChrome({ tabsManager }: { tabsManager: DesktopTabsManagerState }) {
  const slots = useActiveDesktopTabSlots()
  const { tabs, activeTabId, setActiveTabId, addTab, closeTab } = tabsManager

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
      inspector={slots.inspector}
      inspectorOpen={slots.inspectorOpen}
      tabBar={
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onAddTab={addTab}
          onCloseTab={closeTab}
        />
      }
    />
  )
}

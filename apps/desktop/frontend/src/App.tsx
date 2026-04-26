import './style.css'
import { AppChrome } from './ui/AppChrome'
import { useDesktopAppModel } from './useDesktopAppModel'
import { useDesktopBridge } from './useDesktopBridge'
import { useDesktopRecentPairs } from './useDesktopRecentPairs'

export function App() {
  const api = useDesktopBridge()
  const recentPairs = useDesktopRecentPairs()

  const {
    mode,
    onModeChange,
    layoutMode,
    sidebar,
    headerActions,
    main,
    inspector,
    inspectorOpen,
  } = useDesktopAppModel({ api, recentPairs })

  return (
    <AppChrome
      mode={mode}
      onModeChange={onModeChange}
      layoutMode={layoutMode}
      sidebar={sidebar}
      headerActions={headerActions}
      main={main}
      inspector={inspector}
      inspectorOpen={inspectorOpen}
    />
  )
}

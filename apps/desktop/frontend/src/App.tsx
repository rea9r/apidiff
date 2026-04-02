import './style.css'
import { AppChrome } from './ui/AppChrome'
import { useDesktopAppModel } from './useDesktopAppModel'

export function App() {
  const {
    mode,
    onModeChange,
    layoutMode,
    sidebar,
    headerActions,
    main,
    inspector,
    inspectorOpen,
  } = useDesktopAppModel()

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

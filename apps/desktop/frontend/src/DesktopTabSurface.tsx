import { useEffect, useLayoutEffect } from 'react'
import { useDesktopAppModel } from './useDesktopAppModel'
import { usePublishDesktopTabSlots } from './useDesktopTabSlotsContext'
import type { useDesktopBridge } from './useDesktopBridge'
import type { DesktopRecentPairsState } from './useDesktopRecentPairs'

type DesktopTabSurfaceProps = {
  tabId: string
  isActive: boolean
  isInitialTab: boolean
  api: ReturnType<typeof useDesktopBridge>
  recentPairs: DesktopRecentPairsState
  onLabelChange: (id: string, label: string) => void
}

export function DesktopTabSurface({
  tabId,
  isActive,
  isInitialTab,
  api,
  recentPairs,
  onLabelChange,
}: DesktopTabSurfaceProps) {
  // Persistence load is gated to the initial tab so newly added tabs start empty
  // instead of clobbering each other with the same on-disk session snapshot.
  const slots = useDesktopAppModel({ api, recentPairs, enabled: isInitialTab && isActive })
  const publish = usePublishDesktopTabSlots()

  // useLayoutEffect so the active tab's slots are published before paint,
  // avoiding a flash of empty chrome on first mount or tab switch.
  useLayoutEffect(() => {
    if (isActive) {
      publish(slots)
    }
  }, [isActive, slots, publish])

  useEffect(() => {
    if (slots.tabLabel) {
      onLabelChange(tabId, slots.tabLabel)
    }
  }, [tabId, slots.tabLabel, onLabelChange])

  return null
}

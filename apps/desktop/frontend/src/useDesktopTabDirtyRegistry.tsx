import { createContext, useCallback, useContext, useRef } from 'react'
import type { ReactNode } from 'react'

type DirtyRegistry = {
  setTabDirty: (tabId: string, isDirty: boolean) => void
  isTabDirty: (tabId: string) => boolean
  dirtyTabIdsAmong: (ids: string[]) => string[]
}

const DesktopTabDirtyContext = createContext<DirtyRegistry | null>(null)

export function DesktopTabDirtyProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef<Set<string>>(new Set())

  const setTabDirty = useCallback((tabId: string, isDirty: boolean) => {
    if (isDirty) {
      dirtyRef.current.add(tabId)
    } else {
      dirtyRef.current.delete(tabId)
    }
  }, [])

  const isTabDirty = useCallback((tabId: string) => dirtyRef.current.has(tabId), [])

  const dirtyTabIdsAmong = useCallback(
    (ids: string[]) => ids.filter((id) => dirtyRef.current.has(id)),
    [],
  )

  const value = useRef<DirtyRegistry>({ setTabDirty, isTabDirty, dirtyTabIdsAmong }).current

  return (
    <DesktopTabDirtyContext.Provider value={value}>
      {children}
    </DesktopTabDirtyContext.Provider>
  )
}

export function useDesktopTabDirtyRegistry(): DirtyRegistry {
  const ctx = useContext(DesktopTabDirtyContext)
  if (!ctx) {
    throw new Error(
      'useDesktopTabDirtyRegistry must be used within DesktopTabDirtyProvider',
    )
  }
  return ctx
}

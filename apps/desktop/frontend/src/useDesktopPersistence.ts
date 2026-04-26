import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type {
  DesktopState,
  LoadTextFileRequest,
  LoadTextFileResponse,
  Mode,
} from './types'
import { ignorePathsToText } from './utils/appHelpers'
import { defaultJSONCommon, defaultTextCommon } from './useDesktopModeState'

type StateSetter<T> = Dispatch<SetStateAction<T>>

type LoadDesktopStateFn = () => Promise<DesktopState>
type SaveDesktopStateFn = (state: DesktopState) => Promise<void>
type LoadTextFileFn = (req: LoadTextFileRequest) => Promise<LoadTextFileResponse>

type UseDesktopPersistenceOptions = {
  mode: Mode
  setMode: StateSetter<Mode>
  loadDesktopState?: LoadDesktopStateFn
  saveDesktopState?: SaveDesktopStateFn
  loadTextFile?: LoadTextFileFn
  json: {
    oldSourcePath: string
    newSourcePath: string
    ignoreOrder: boolean
    common: DesktopState['json']['common']
    recentPairs: DesktopState['jsonRecentPairs']
    setIgnoreOrder: StateSetter<boolean>
    setCommon: StateSetter<DesktopState['json']['common']>
    setIgnorePathsDraft: StateSetter<string>
    setOldSourcePath: StateSetter<string>
    setNewSourcePath: StateSetter<string>
    setRecentPairs: StateSetter<DesktopState['jsonRecentPairs']>
    setOldText: StateSetter<string>
    setNewText: StateSetter<string>
  }
  text: {
    oldSourcePath: string
    newSourcePath: string
    common: DesktopState['text']['common']
    diffLayout: DesktopState['text']['diffLayout']
    recentPairs: DesktopState['textRecentPairs']
    setCommon: StateSetter<DesktopState['text']['common']>
    setDiffLayout: StateSetter<DesktopState['text']['diffLayout']>
    setOldSourcePath: StateSetter<string>
    setNewSourcePath: StateSetter<string>
    setRecentPairs: StateSetter<DesktopState['textRecentPairs']>
    setOldText: StateSetter<string>
    setNewText: StateSetter<string>
  }
  directory: {
    leftRoot: string
    rightRoot: string
    currentPath: string
    viewMode: DesktopState['directory']['viewMode']
    recentPairs: DesktopState['directoryRecentPairs']
    setLeftRoot: StateSetter<string>
    setRightRoot: StateSetter<string>
    setCurrentPath: StateSetter<string>
    setViewMode: StateSetter<DesktopState['directory']['viewMode']>
    setRecentPairs: StateSetter<DesktopState['directoryRecentPairs']>
  }
}

const APP_MODES: Mode[] = ['text', 'json', 'directory']

function isMode(value: string): value is Mode {
  return APP_MODES.includes(value as Mode)
}

export function useDesktopPersistence({
  mode,
  setMode,
  loadDesktopState,
  saveDesktopState,
  loadTextFile,
  json,
  text,
  directory,
}: UseDesktopPersistenceOptions) {
  const [desktopStateHydrated, setDesktopStateHydrated] = useState(false)

  const {
    oldSourcePath: jsonOldSourcePath,
    newSourcePath: jsonNewSourcePath,
    ignoreOrder,
    common: jsonCommon,
    recentPairs: jsonRecentPairs,
    setIgnoreOrder,
    setCommon: setJSONCommon,
    setIgnorePathsDraft: setJSONIgnorePathsDraft,
    setOldSourcePath: setJSONOldSourcePath,
    setNewSourcePath: setJSONNewSourcePath,
    setRecentPairs: setJSONRecentPairs,
    setOldText: setJSONOldText,
    setNewText: setJSONNewText,
  } = json

  const {
    oldSourcePath: textOldSourcePath,
    newSourcePath: textNewSourcePath,
    common: textCommon,
    diffLayout: textDiffLayout,
    recentPairs: textRecentPairs,
    setCommon: setTextCommon,
    setDiffLayout: setTextDiffLayout,
    setOldSourcePath: setTextOldSourcePath,
    setNewSourcePath: setTextNewSourcePath,
    setRecentPairs: setTextRecentPairs,
    setOldText: setTextOld,
    setNewText: setTextNew,
  } = text

  const {
    leftRoot: directoryLeftRoot,
    rightRoot: directoryRightRoot,
    currentPath: directoryCurrentPath,
    viewMode: directoryViewMode,
    recentPairs: directoryRecentPairs,
    setLeftRoot: setDirectoryLeftRoot,
    setRightRoot: setDirectoryRightRoot,
    setCurrentPath: setDirectoryCurrentPath,
    setViewMode: setDirectoryViewMode,
    setRecentPairs: setDirectoryRecentPairs,
  } = directory

  useEffect(() => {
    let active = true

    const hydrate = async () => {
      if (!loadDesktopState) {
        if (active) {
          setDesktopStateHydrated(true)
        }
        return
      }

      try {
        const saved = await loadDesktopState()
        if (!active || !saved) {
          return
        }

        if (isMode(saved.lastUsedMode)) {
          setMode(saved.lastUsedMode)
        }

        setIgnoreOrder(!!saved.json.ignoreOrder)
        const mergedJSONCommon = { ...defaultJSONCommon, ...saved.json.common }
        setJSONCommon(mergedJSONCommon)
        setJSONIgnorePathsDraft(ignorePathsToText(mergedJSONCommon.ignorePaths))
        setJSONOldSourcePath(saved.json.oldSourcePath || '')
        setJSONNewSourcePath(saved.json.newSourcePath || '')

        setTextCommon({ ...defaultTextCommon, ...saved.text.common })
        setTextDiffLayout(saved.text.diffLayout === 'unified' ? 'unified' : 'split')
        setTextOldSourcePath(saved.text.oldSourcePath || '')
        setTextNewSourcePath(saved.text.newSourcePath || '')

        setDirectoryLeftRoot(saved.directory.leftRoot || '')
        setDirectoryRightRoot(saved.directory.rightRoot || '')
        setDirectoryCurrentPath(saved.directory.currentPath || '')
        setDirectoryViewMode(saved.directory.viewMode === 'tree' ? 'tree' : 'list')

        setJSONRecentPairs(saved.jsonRecentPairs ?? [])
        setTextRecentPairs(saved.textRecentPairs ?? [])
        setDirectoryRecentPairs(saved.directoryRecentPairs ?? [])

        if (loadTextFile) {
          const safeLoad = async (path: string): Promise<string> => {
            const trimmed = path.trim()
            if (!trimmed) {
              return ''
            }
            try {
              const loaded: LoadTextFileResponse = await loadTextFile({
                path: trimmed,
              } satisfies LoadTextFileRequest)
              return loaded.content
            } catch {
              return ''
            }
          }

          const [jsonOld, jsonNew, textOldLoaded, textNewLoaded] = await Promise.all([
            safeLoad(saved.json.oldSourcePath || ''),
            safeLoad(saved.json.newSourcePath || ''),
            safeLoad(saved.text.oldSourcePath || ''),
            safeLoad(saved.text.newSourcePath || ''),
          ])

          if (!active) {
            return
          }

          setJSONOldText(jsonOld)
          setJSONNewText(jsonNew)
          setTextOld(textOldLoaded)
          setTextNew(textNewLoaded)
        }
      } catch {
        // keep app usable even when persistence load fails
      } finally {
        if (active) {
          setDesktopStateHydrated(true)
        }
      }
    }

    void hydrate()
    return () => {
      active = false
    }
  }, [
    loadDesktopState,
    loadTextFile,
    setDirectoryCurrentPath,
    setDirectoryLeftRoot,
    setDirectoryRecentPairs,
    setDirectoryRightRoot,
    setDirectoryViewMode,
    setIgnoreOrder,
    setJSONCommon,
    setJSONIgnorePathsDraft,
    setJSONNewSourcePath,
    setJSONNewText,
    setJSONOldSourcePath,
    setJSONOldText,
    setJSONRecentPairs,
    setMode,
    setTextCommon,
    setTextDiffLayout,
    setTextNew,
    setTextNewSourcePath,
    setTextOld,
    setTextOldSourcePath,
    setTextRecentPairs,
  ])

  useEffect(() => {
    if (!desktopStateHydrated || !saveDesktopState) {
      return
    }

    const timer = window.setTimeout(() => {
      const state: DesktopState = {
        version: 1,
        lastUsedMode: mode,
        json: {
          oldSourcePath: jsonOldSourcePath,
          newSourcePath: jsonNewSourcePath,
          ignoreOrder,
          common: jsonCommon,
        },
        text: {
          oldSourcePath: textOldSourcePath,
          newSourcePath: textNewSourcePath,
          common: textCommon,
          diffLayout: textDiffLayout,
        },
        directory: {
          leftRoot: directoryLeftRoot,
          rightRoot: directoryRightRoot,
          currentPath: directoryCurrentPath,
          viewMode: directoryViewMode,
        },
        jsonRecentPairs,
        textRecentPairs,
        directoryRecentPairs,
      }

      void saveDesktopState(state).catch(() => {
        // keep save errors non-fatal
      })
    }, 500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    desktopStateHydrated,
    directoryCurrentPath,
    directoryLeftRoot,
    directoryRecentPairs,
    directoryRightRoot,
    directoryViewMode,
    ignoreOrder,
    jsonCommon,
    jsonNewSourcePath,
    jsonOldSourcePath,
    jsonRecentPairs,
    mode,
    saveDesktopState,
    textCommon,
    textDiffLayout,
    textNewSourcePath,
    textOldSourcePath,
    textRecentPairs,
  ])
}

import { useEffect, useRef } from 'react'
import { OnFileDrop, OnFileDropOff } from '../../../wailsjs/runtime/runtime'

export type FileDropTarget =
  | 'text-old'
  | 'text-new'
  | 'json-old'
  | 'json-new'
  | 'folder-left'
  | 'folder-right'

export type FileDropHandlers = {
  [K in FileDropTarget]?: (paths: string[]) => void
}

const TARGET_ATTR = 'data-drop-target'

function findDropTarget(element: Element | null): FileDropTarget | null {
  let current: Element | null = element
  while (current) {
    const value = current.getAttribute(TARGET_ATTR)
    if (value) {
      return value as FileDropTarget
    }
    current = current.parentElement
  }
  return null
}

export function useFileDrop(handlers: FileDropHandlers, enabled = true) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) {
      return
    }

    OnFileDrop((x, y, paths) => {
      if (!paths || paths.length === 0) {
        return
      }
      const element = document.elementFromPoint(x, y)
      const target = findDropTarget(element)
      if (!target) {
        return
      }
      const handler = handlersRef.current[target]
      if (!handler) {
        return
      }
      handler(paths)
    }, false)

    return () => {
      OnFileDropOff()
    }
  }, [enabled])
}

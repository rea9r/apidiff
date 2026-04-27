import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

const MIN_HEIGHT = 180
const MAX_HEIGHT = 1200

function clamp(value: number): number {
  if (Number.isNaN(value)) return MIN_HEIGHT
  if (value < MIN_HEIGHT) return MIN_HEIGHT
  if (value > MAX_HEIGHT) return MAX_HEIGHT
  return value
}

function readStored(storageKey: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? clamp(parsed) : fallback
}

export function useDragResizeHeight(storageKey: string, defaultHeight: number) {
  const [height, setHeight] = useState(() => readStored(storageKey, defaultHeight))
  const startYRef = useRef(0)
  const startHeightRef = useRef(defaultHeight)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, String(height))
  }, [storageKey, height])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return
      const delta = event.clientY - startYRef.current
      setHeight(clamp(startHeightRef.current + delta))
    }

    const onPointerUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    isDraggingRef.current = true
    startYRef.current = event.clientY
    startHeightRef.current = height
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }

  return { height, onPointerDown }
}

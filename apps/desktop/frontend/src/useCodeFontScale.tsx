import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'xdiff:code-font-scale'
const DEFAULT_SCALE = 1
const MIN_SCALE = 0.7
const MAX_SCALE = 1.6
const SCALE_STEP = 0.01
const KEYBOARD_STEP = 0.05

function clampScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SCALE
  const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value))
  return Math.round(clamped * 100) / 100
}

function loadInitialScale(): number {
  if (typeof window === 'undefined') return DEFAULT_SCALE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SCALE
    return clampScale(Number.parseFloat(raw))
  } catch {
    return DEFAULT_SCALE
  }
}

type CodeFontScaleContextValue = {
  scale: number
  min: number
  max: number
  step: number
  setScale: (value: number) => void
  increase: () => void
  decrease: () => void
  reset: () => void
}

const CodeFontScaleContext = createContext<CodeFontScaleContextValue | null>(null)

export function CodeFontScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<number>(() => loadInitialScale())

  useEffect(() => {
    document.documentElement.style.setProperty('--xdiff-code-scale', String(scale))
    try {
      window.localStorage.setItem(STORAGE_KEY, String(scale))
    } catch {
      // ignore quota / disabled storage
    }
  }, [scale])

  const setScale = useCallback((value: number) => {
    setScaleState(clampScale(value))
  }, [])

  const increase = useCallback(() => {
    setScaleState((prev) => clampScale(prev + KEYBOARD_STEP))
  }, [])

  const decrease = useCallback(() => {
    setScaleState((prev) => clampScale(prev - KEYBOARD_STEP))
  }, [])

  const reset = useCallback(() => {
    setScaleState(DEFAULT_SCALE)
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const ctrlOrCmd = event.ctrlKey || event.metaKey
      if (!ctrlOrCmd || event.altKey) {
        return
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        increase()
        return
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        decrease()
        return
      }
      if (event.key === '0') {
        event.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [increase, decrease, reset])

  return (
    <CodeFontScaleContext.Provider
      value={{
        scale,
        min: MIN_SCALE,
        max: MAX_SCALE,
        step: SCALE_STEP,
        setScale,
        increase,
        decrease,
        reset,
      }}
    >
      {children}
    </CodeFontScaleContext.Provider>
  )
}

const NOOP_CODE_FONT_SCALE: CodeFontScaleContextValue = {
  scale: DEFAULT_SCALE,
  min: MIN_SCALE,
  max: MAX_SCALE,
  step: SCALE_STEP,
  setScale: () => {},
  increase: () => {},
  decrease: () => {},
  reset: () => {},
}

export function useCodeFontScale(): CodeFontScaleContextValue {
  return useContext(CodeFontScaleContext) ?? NOOP_CODE_FONT_SCALE
}

export function formatCodeFontScalePercent(scale: number): string {
  return `${Math.round(scale * 100)}%`
}

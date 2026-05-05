import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })
}

// jsdom does not implement Element.scrollIntoView; stub it so effects that
// scroll the active tab/row into view don't throw.
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = vi.fn()
}

// Wails injects `window.runtime` at runtime; in jsdom we stub the methods
// the app actually calls so component effects don't throw on mount.
if (!(window as unknown as { runtime?: unknown }).runtime) {
  Object.defineProperty(window, 'runtime', {
    writable: true,
    value: {
      OnFileDrop: vi.fn(),
      OnFileDropOff: vi.fn(),
      EventsOn: vi.fn(() => () => {}),
      EventsOff: vi.fn(),
      WindowToggleMaximise: vi.fn(),
    },
  })
}

import { IconPlus, IconX } from '@tabler/icons-react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { DesktopTab } from '../useDesktopTabsManager'

type TabBarProps = {
  tabs: DesktopTab[]
  activeTabId: string
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onCloseTab: (id: string) => void
}

export function TabBar({ tabs, activeTabId, onSelectTab, onAddTab, onCloseTab }: TabBarProps) {
  const canClose = tabs.length > 1

  return (
    <div className="xdiff-tab-bar" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const handleClose = (event: ReactMouseEvent<HTMLButtonElement>) => {
          event.stopPropagation()
          onCloseTab(tab.id)
        }
        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            aria-selected={isActive}
            className={`xdiff-tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectTab(tab.id)
              }
            }}
          >
            <span className="xdiff-tab-label">{tab.label}</span>
            {canClose ? (
              <button
                type="button"
                className="xdiff-tab-close"
                onClick={handleClose}
                aria-label={`Close ${tab.label}`}
              >
                <IconX size={12} />
              </button>
            ) : null}
          </div>
        )
      })}
      <button
        type="button"
        className="xdiff-tab-add"
        onClick={onAddTab}
        aria-label="New tab"
      >
        <IconPlus size={14} />
      </button>
    </div>
  )
}

import { IconBackspace, IconFolderOpen } from '@tabler/icons-react'
import { ComparePaneAction, ComparePaneActions } from './CompareSourceActions'

type ComparePathInputBodyProps = {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  onBrowse?: () => void
  onClear?: () => void
  browseDisabled?: boolean
  clearDisabled?: boolean
  browseLabel?: string
  clearLabel?: string
}

export function ComparePathInputBody({
  value,
  placeholder,
  onChange,
  onBrowse,
  onClear,
  browseDisabled = false,
  clearDisabled = false,
  browseLabel = 'Browse file',
  clearLabel = 'Clear path',
}: ComparePathInputBodyProps) {
  return (
    <div className="compare-path-input-body">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <ComparePaneActions>
        <ComparePaneAction
          label={browseLabel}
          onClick={onBrowse}
          disabled={!onBrowse || browseDisabled}
        >
          <IconFolderOpen size={14} />
        </ComparePaneAction>
        <ComparePaneAction
          label={clearLabel}
          onClick={onClear}
          disabled={!onClear || clearDisabled}
          danger
        >
          <IconBackspace size={14} />
        </ComparePaneAction>
      </ComparePaneActions>
    </div>
  )
}

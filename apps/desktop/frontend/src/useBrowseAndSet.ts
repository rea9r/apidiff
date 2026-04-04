import { useCallback } from 'react'
import { formatUnknownError } from './utils/appHelpers'
import { showErrorNotification } from './utils/notifications'

type Picker = (() => Promise<string>) | undefined

type Setter = (value: string) => void

interface UseBrowseAndSetOptions {
  setSummaryLine: (value: string) => void
  setOutput: (value: string) => void
}

export function useBrowseAndSet({
  setSummaryLine,
  setOutput,
}: UseBrowseAndSetOptions) {
  const browseAndSet = useCallback(
    async (picker: Picker, setter: Setter) => {
      if (!picker) {
        setSummaryLine('error=yes')
        setOutput('Wails bridge not available (file picker)')
        showErrorNotification('File picker unavailable', 'Wails bridge not available (file picker)')
        return
      }

      try {
        const selected = await picker()
        if (selected) {
          setter(selected)
        }
      } catch (e) {
        setSummaryLine('error=yes')
        setOutput(String(e))
        showErrorNotification('Failed to pick file', formatUnknownError(e))
      }
    },
    [setOutput, setSummaryLine],
  )

  return { browseAndSet }
}

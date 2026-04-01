import { useCallback } from 'react'
import { notifications } from '@mantine/notifications'
import { formatUnknownError } from './utils/appHelpers'

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
        notifications.show({
          title: 'File picker unavailable',
          message: 'Wails bridge not available (file picker)',
          color: 'red',
        })
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
        notifications.show({
          title: 'Failed to pick file',
          message: formatUnknownError(e),
          color: 'red',
        })
      }
    },
    [setOutput, setSummaryLine],
  )

  return { browseAndSet }
}

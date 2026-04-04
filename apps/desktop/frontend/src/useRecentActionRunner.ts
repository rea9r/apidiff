import { useCallback } from 'react'
import { formatUnknownError } from './utils/appHelpers'
import { showErrorNotification } from './utils/notifications'

type UseRecentActionRunnerOptions = {
  setLoading: (value: boolean) => void
}

export function useRecentActionRunner({ setLoading }: UseRecentActionRunnerOptions) {
  const runRecentAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      setLoading(true)
      try {
        await action()
      } catch (error) {
        showErrorNotification(`${label} failed`, formatUnknownError(error))
      } finally {
        setLoading(false)
      }
    },
    [setLoading],
  )

  return {
    runRecentAction,
  }
}

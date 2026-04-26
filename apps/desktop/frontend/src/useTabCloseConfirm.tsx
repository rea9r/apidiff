import { useCallback, useRef, useState } from 'react'
import { Button, Group, Modal, Stack, Text } from '@mantine/core'

type Pending = {
  count: number
  resolve: (ok: boolean) => void
}

export function useTabCloseConfirm() {
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  pendingRef.current = pending

  const confirm = useCallback(
    (dirtyCount: number): Promise<boolean> => {
      if (pendingRef.current) return Promise.resolve(false)
      return new Promise<boolean>((resolve) => {
        setPending({ count: dirtyCount, resolve })
      })
    },
    [],
  )

  const handleCancel = () => {
    pendingRef.current?.resolve(false)
    setPending(null)
  }

  const handleConfirm = () => {
    pendingRef.current?.resolve(true)
    setPending(null)
  }

  const message =
    pending?.count === 1
      ? '1 tab has unsaved changes. Close it anyway?'
      : `${pending?.count ?? 0} tabs have unsaved changes. Close them anyway?`

  const modal = (
    <Modal
      opened={pending !== null}
      onClose={handleCancel}
      title="Unsaved changes"
      centered
      withCloseButton={false}
    >
      <Stack gap="md">
        <Text size="sm">{message}</Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm}>
            Close anyway
          </Button>
        </Group>
      </Stack>
    </Modal>
  )

  return { confirm, modal }
}

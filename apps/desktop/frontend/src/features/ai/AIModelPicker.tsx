import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconChevronDown, IconPlus, IconTrash } from '@tabler/icons-react'
import { useDesktopBridge } from '../../useDesktopBridge'
import { formatUnknownError } from '../../utils/appHelpers'

const CONFIRM_REVERT_MS = 3000

export type AIModelPickerProps = {
  models: string[]
  activeModel: string
  onChange: (model: string) => void
  onModelsChanged: () => Promise<void> | void
  onAddModel?: () => void
  onError?: (message: string) => void
  disabled?: boolean
}

export function AIModelPicker({
  models,
  activeModel,
  onChange,
  onModelsChanged,
  onAddModel,
  onError,
  disabled,
}: AIModelPickerProps) {
  const { deleteOllamaModel } = useDesktopBridge()

  const [opened, setOpened] = useState(false)
  const [confirmDeleteModel, setConfirmDeleteModel] = useState<string | null>(null)
  const [deletingModel, setDeletingModel] = useState<string | null>(null)
  const revertTimeoutRef = useRef<number | null>(null)

  const queueDeleteConfirm = useCallback((m: string | null) => {
    if (revertTimeoutRef.current !== null) {
      window.clearTimeout(revertTimeoutRef.current)
      revertTimeoutRef.current = null
    }
    setConfirmDeleteModel(m)
    if (m !== null) {
      revertTimeoutRef.current = window.setTimeout(() => {
        setConfirmDeleteModel(null)
        revertTimeoutRef.current = null
      }, CONFIRM_REVERT_MS)
    }
  }, [])

  useEffect(
    () => () => {
      if (revertTimeoutRef.current !== null) {
        window.clearTimeout(revertTimeoutRef.current)
        revertTimeoutRef.current = null
      }
    },
    [],
  )

  useEffect(() => {
    if (!opened) queueDeleteConfirm(null)
  }, [opened, queueDeleteConfirm])

  const handleDeleteClick = useCallback(
    async (m: string) => {
      if (confirmDeleteModel !== m) {
        queueDeleteConfirm(m)
        return
      }
      queueDeleteConfirm(null)
      setDeletingModel(m)
      try {
        await deleteOllamaModel({ model: m })
        await onModelsChanged()
      } catch (e) {
        onError?.(formatUnknownError(e))
      } finally {
        setDeletingModel(null)
      }
    },
    [confirmDeleteModel, queueDeleteConfirm, deleteOllamaModel, onModelsChanged, onError],
  )

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      shadow="md"
      width={320}
      withinPortal
      trapFocus={false}
      disabled={disabled}
    >
      <Popover.Target>
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          rightSection={<IconChevronDown size={11} style={{ opacity: 0.6 }} />}
          onClick={() => setOpened((o) => !o)}
          disabled={disabled}
          aria-label="Switch model"
          styles={{
            root: { fontWeight: 400, maxWidth: 220, minWidth: 0 },
            label: {
              fontFamily:
                'var(--mantine-font-family-monospace, ui-monospace, monospace)',
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }}
        >
          {activeModel || '—'}
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <Stack gap="xs">
          {models.length === 0 ? (
            <Text size="xs" c="dimmed">
              No models installed.
            </Text>
          ) : (
            <Stack gap={2}>
              {models.map((m) => {
                const isActive = m === activeModel
                const isConfirming = confirmDeleteModel === m
                const isDeleting = deletingModel === m
                return (
                  <Group
                    key={m}
                    wrap="nowrap"
                    gap="xs"
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: isActive
                        ? 'var(--mantine-color-default-hover)'
                        : 'transparent',
                      cursor: isActive ? 'default' : 'pointer',
                    }}
                    onClick={() => {
                      if (!isActive) {
                        onChange(m)
                        setOpened(false)
                      }
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        display: 'inline-flex',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      {isActive ? (
                        <IconCheck
                          size={12}
                          style={{ color: 'var(--mantine-color-green-5)' }}
                        />
                      ) : null}
                    </span>
                    <Text
                      size="sm"
                      ff="monospace"
                      style={{
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m}
                    </Text>
                    <Tooltip
                      label={isConfirming ? 'Click again to confirm' : 'Delete'}
                    >
                      <ActionIcon
                        size="sm"
                        variant={isConfirming ? 'filled' : 'subtle'}
                        color={isConfirming ? 'red' : 'gray'}
                        loading={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleDeleteClick(m)
                        }}
                        aria-label={
                          isConfirming ? `Confirm delete ${m}` : `Delete ${m}`
                        }
                      >
                        <IconTrash size={13} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )
              })}
            </Stack>
          )}

          {onAddModel ? (
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              leftSection={<IconPlus size={12} />}
              onClick={() => {
                setOpened(false)
                onAddModel()
              }}
              style={{ alignSelf: 'flex-start' }}
            >
              Add model
            </Button>
          ) : null}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

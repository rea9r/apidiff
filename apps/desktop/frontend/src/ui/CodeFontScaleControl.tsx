import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Slider,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconTextSize } from '@tabler/icons-react'
import {
  formatCodeFontScalePercent,
  useCodeFontScale,
} from '../useCodeFontScale'
import { HEADER_RAIL_HEIGHT, HEADER_RAIL_ICON_SIZE } from './HeaderRail'

const SLIDER_MARKS = [
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
]

export function CodeFontScaleControl() {
  const { scale, min, max, step, setScale, reset } = useCodeFontScale()
  const tooltip = `Code font size: ${formatCodeFontScalePercent(scale)}`

  return (
    <Popover position="bottom-end" withinPortal shadow="md" width={260}>
      <Popover.Target>
        <Tooltip label={tooltip}>
          <ActionIcon
            variant="default"
            size={HEADER_RAIL_HEIGHT}
            radius="md"
            aria-label="Change code font size"
          >
            <IconTextSize size={HEADER_RAIL_ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <Group justify="space-between" align="baseline">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Code font size
            </Text>
            <Text size="lg" fw={600} ff="monospace">
              {formatCodeFontScalePercent(scale)}
            </Text>
          </Group>
          <Slider
            min={min}
            max={max}
            step={step}
            value={scale}
            onChange={setScale}
            label={(value) => formatCodeFontScalePercent(value)}
            marks={SLIDER_MARKS}
            aria-label="Code font size slider"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" size="xs" onClick={reset}>
              Reset to 100%
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

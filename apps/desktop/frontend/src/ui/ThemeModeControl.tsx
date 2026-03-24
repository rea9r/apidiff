import { SegmentedControl, useMantineColorScheme } from '@mantine/core'

export function ThemeModeControl() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <SegmentedControl
      size="xs"
      value={colorScheme}
      onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
      data={[
        { value: 'auto', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
    />
  )
}

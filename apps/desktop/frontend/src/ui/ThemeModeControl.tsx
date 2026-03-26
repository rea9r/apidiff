import { SegmentedControl, useMantineColorScheme } from '@mantine/core'

export function ThemeModeControl() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <SegmentedControl
      className="xdiff-header-theme-toggle"
      size="sm"
      styles={{
        root: {
          minHeight: 'var(--xdiff-header-control-height)',
          borderRadius: 'var(--xdiff-header-control-radius)',
        },
        control: {
          minHeight: 'var(--xdiff-header-control-height)',
        },
      }}
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

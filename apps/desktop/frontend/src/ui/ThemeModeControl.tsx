import { SegmentedControl, useMantineColorScheme } from '@mantine/core'

export function ThemeModeControl() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <SegmentedControl
      className="xdiff-header-theme-toggle"
      size="xs"
      styles={{
        root: {
          minHeight: 'var(--xdiff-header-control-height)',
          height: 'var(--xdiff-header-control-height)',
          borderRadius: 'var(--xdiff-header-control-radius)',
          padding: 2,
        },
        control: {
          minHeight: 'calc(var(--xdiff-header-control-height) - 4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        label: {
          paddingInline: 8,
          fontSize: 12,
        },
      }}
      value={colorScheme}
      onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
      data={[
        { value: 'auto', label: 'Auto' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
    />
  )
}

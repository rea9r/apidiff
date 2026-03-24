import { Badge } from '@mantine/core'
import type { ReactNode } from 'react'

type StatusTone = 'default' | 'success' | 'warning' | 'danger' | 'accent'

export function StatusBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: StatusTone
}) {
  const color =
    tone === 'success'
      ? 'green'
      : tone === 'warning'
        ? 'yellow'
        : tone === 'danger'
          ? 'red'
          : tone === 'accent'
            ? 'blue'
            : 'gray'

  return (
    <Badge color={color} variant="light" radius="sm">
      {children}
    </Badge>
  )
}

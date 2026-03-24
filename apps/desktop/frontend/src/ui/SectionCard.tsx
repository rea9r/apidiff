import { Card, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'

type SectionCardProps = {
  title?: string
  children: ReactNode
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <Card withBorder radius="md" padding="md">
      <Stack gap="sm">
        {title ? <Text fw={600}>{title}</Text> : null}
        {children}
      </Stack>
    </Card>
  )
}

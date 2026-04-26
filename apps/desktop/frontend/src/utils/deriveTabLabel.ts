import type { Mode } from '../types'

function basename(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) {
    return ''
  }
  const parts = trimmed.split(/[\\/]/)
  return parts[parts.length - 1] || ''
}

function pairLabel(oldPath: string, newPath: string): string | null {
  const oldName = basename(oldPath)
  const newName = basename(newPath)
  if (oldName && newName) {
    return `${oldName} ↔ ${newName}`
  }
  if (oldName || newName) {
    return oldName || newName
  }
  return null
}

export type DeriveTabLabelInput = {
  mode: Mode
  textOldSourcePath: string
  textNewSourcePath: string
  jsonOldSourcePath: string
  jsonNewSourcePath: string
  directoryLeftRoot: string
  directoryRightRoot: string
}

export function deriveTabLabel(input: DeriveTabLabelInput): string | null {
  if (input.mode === 'text') {
    return pairLabel(input.textOldSourcePath, input.textNewSourcePath)
  }
  if (input.mode === 'json') {
    return pairLabel(input.jsonOldSourcePath, input.jsonNewSourcePath)
  }
  if (input.mode === 'directory') {
    return pairLabel(input.directoryLeftRoot, input.directoryRightRoot)
  }
  return null
}

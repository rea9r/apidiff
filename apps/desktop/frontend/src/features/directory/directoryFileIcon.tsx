import {
  IconFile,
  IconFileCode,
  IconFileSettings,
  IconFileText,
  IconFileTypeCsv,
  IconFileTypeCss,
  IconFileTypeHtml,
  IconFileTypeJs,
  IconFileTypeJsx,
  IconFileTypePdf,
  IconFileTypePhp,
  IconFileTypeRs,
  IconFileTypeSql,
  IconFileTypeTs,
  IconFileTypeTsx,
  IconFileTypeXml,
  IconFileZip,
  IconFolderFilled,
  IconJson,
  IconMarkdown,
  IconMovie,
  IconMusic,
  IconPhoto,
  IconToml,
} from '@tabler/icons-react'

const ICON_BY_EXT: Record<string, typeof IconFile> = {
  // Code with dedicated icons
  js: IconFileTypeJs,
  mjs: IconFileTypeJs,
  cjs: IconFileTypeJs,
  jsx: IconFileTypeJsx,
  ts: IconFileTypeTs,
  tsx: IconFileTypeTsx,
  html: IconFileTypeHtml,
  htm: IconFileTypeHtml,
  css: IconFileTypeCss,
  scss: IconFileTypeCss,
  sass: IconFileTypeCss,
  less: IconFileTypeCss,
  xml: IconFileTypeXml,
  rs: IconFileTypeRs,
  php: IconFileTypePhp,
  sql: IconFileTypeSql,
  csv: IconFileTypeCsv,
  pdf: IconFileTypePdf,
  // Other code → generic code icon
  go: IconFileCode,
  py: IconFileCode,
  rb: IconFileCode,
  java: IconFileCode,
  c: IconFileCode,
  cc: IconFileCode,
  cpp: IconFileCode,
  h: IconFileCode,
  hpp: IconFileCode,
  sh: IconFileCode,
  bash: IconFileCode,
  zsh: IconFileCode,
  kt: IconFileCode,
  swift: IconFileCode,
  scala: IconFileCode,
  lua: IconFileCode,
  pl: IconFileCode,
  clj: IconFileCode,
  // Config / data
  json: IconJson,
  yaml: IconFileSettings,
  yml: IconFileSettings,
  toml: IconToml,
  ini: IconFileSettings,
  conf: IconFileSettings,
  env: IconFileSettings,
  // Text / docs
  md: IconMarkdown,
  markdown: IconMarkdown,
  txt: IconFileText,
  log: IconFileText,
  rst: IconFileText,
  // Images
  png: IconPhoto,
  jpg: IconPhoto,
  jpeg: IconPhoto,
  gif: IconPhoto,
  webp: IconPhoto,
  svg: IconPhoto,
  bmp: IconPhoto,
  ico: IconPhoto,
  tiff: IconPhoto,
  // Video
  mp4: IconMovie,
  mov: IconMovie,
  avi: IconMovie,
  mkv: IconMovie,
  webm: IconMovie,
  // Audio
  mp3: IconMusic,
  wav: IconMusic,
  ogg: IconMusic,
  flac: IconMusic,
  m4a: IconMusic,
  // Archives
  zip: IconFileZip,
  tar: IconFileZip,
  gz: IconFileZip,
  bz2: IconFileZip,
  rar: IconFileZip,
  '7z': IconFileZip,
  xz: IconFileZip,
  tgz: IconFileZip,
}

export function DirectoryEntryIcon({
  name,
  isDir,
  size = 14,
}: {
  name: string
  isDir: boolean
  size?: number
}) {
  if (isDir) {
    return <IconFolderFilled size={size} />
  }
  const lower = name.toLowerCase()
  const dot = lower.lastIndexOf('.')
  const ext = dot > 0 ? lower.slice(dot + 1) : ''
  const Icon = ICON_BY_EXT[ext] ?? IconFile
  return <Icon size={size} />
}

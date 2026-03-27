type ComparePathSlotProps = {
  path?: string
  title?: string
}

export function ComparePathSlot({ path, title }: ComparePathSlotProps) {
  const text = path ?? ''
  const tooltip = title ?? text

  return (
    <div className="compare-path-slot">
      {text ? (
        <div className="muted compare-path-slot-text" title={tooltip}>
          {text}
        </div>
      ) : (
        <div className="compare-path-slot-text compare-path-slot-empty" aria-hidden="true" />
      )}
    </div>
  )
}

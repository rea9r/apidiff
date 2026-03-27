type CompareTextInputBodyProps = {
  value: string
  onChange: (value: string) => void
}

export function CompareTextInputBody({ value, onChange }: CompareTextInputBodyProps) {
  return (
    <textarea
      className="text-editor compare-text-input-body"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

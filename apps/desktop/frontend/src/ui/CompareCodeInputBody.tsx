import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useComputedColorScheme } from '@mantine/core'
import type { Extension } from '@codemirror/state'
import {
  createCompareCodeEditorTheme,
  createCompareCodeHighlightStyle,
} from './codeEditorTheme'

type CompareCodeInputLanguage = 'json' | 'yaml'
const LazyCodeMirror = lazy(() => import('@uiw/react-codemirror'))

type CompareCodeInputBodyProps = {
  value: string
  onChange: (value: string) => void
  language: CompareCodeInputLanguage
  parseError?: string | null
  placeholder?: string
  helperText?: string
}

export function CompareCodeInputBody({
  value,
  onChange,
  language,
  parseError = null,
  placeholder,
  helperText,
}: CompareCodeInputBodyProps) {
  const [languageExtension, setLanguageExtension] = useState<Extension | null>(null)

  useEffect(() => {
    let disposed = false

    const loadLanguageExtension = async () => {
      if (language === 'json') {
        const module = await import('@codemirror/lang-json')
        if (!disposed) {
          setLanguageExtension(module.json())
        }
        return
      }

      const module = await import('@codemirror/lang-yaml')
      if (!disposed) {
        setLanguageExtension(module.yaml())
      }
    }

    setLanguageExtension(null)
    void loadLanguageExtension()

    return () => {
      disposed = true
    }
  }, [language])

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const editorTheme = useMemo(
    () => createCompareCodeEditorTheme(computedColorScheme === 'dark' ? 'dark' : 'light'),
    [computedColorScheme],
  )
  const editorHighlight = useMemo(
    () => createCompareCodeHighlightStyle(computedColorScheme === 'dark' ? 'dark' : 'light'),
    [computedColorScheme],
  )
  const editorExtensions = useMemo(
    () => (languageExtension ? [languageExtension, editorTheme, editorHighlight] : []),
    [languageExtension, editorTheme, editorHighlight],
  )
  const label = language === 'json' ? 'JSON' : 'YAML'
  const defaultPlaceholder =
    language === 'json' ? 'Paste or edit JSON here' : 'Paste or edit OpenAPI YAML here'
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder
  const resolvedHelperText = helperText ?? 'Open file, paste clipboard, or edit directly'
  const showPlaceholder = value.trim().length === 0

  return (
    <div className="compare-code-input-body-wrap">
      <div className="compare-code-input-shell">
        <div className="compare-code-input-language">{label}</div>
        {showPlaceholder ? (
          <div className="compare-code-input-placeholder">{resolvedPlaceholder}</div>
        ) : null}
        <div className="compare-code-input-body" data-language={language}>
          {languageExtension ? (
            <Suspense
              fallback={
                <textarea
                  className="compare-text-input"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  spellCheck={false}
                />
              }
            >
              <LazyCodeMirror
                value={value}
                height="220px"
                extensions={editorExtensions}
                onChange={onChange}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false,
                  autocompletion: false,
                  searchKeymap: true,
                }}
              />
            </Suspense>
          ) : (
            <textarea
              className="compare-text-input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              spellCheck={false}
            />
          )}
        </div>
      </div>
      <div className="compare-code-input-meta">
        {!parseError ? (
          <div className="compare-code-input-helper">{resolvedHelperText}</div>
        ) : null}
        {parseError ? (
          <div className="compare-code-input-error">
            Invalid {label}: {parseError}
          </div>
        ) : null}
      </div>
    </div>
  )
}

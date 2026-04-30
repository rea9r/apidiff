import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

type DiffEditorColorScheme = 'light' | 'dark'

export function createDiffCodeEditorTheme(colorScheme: DiffEditorColorScheme) {
  const palette =
    colorScheme === 'dark'
      ? {
          background: '#242a35',
          text: '#c9d3e3',
          caret: '#9fb7dc',
          border: '#3a4559',
          activeLine: 'rgba(159, 183, 220, 0.08)',
          selection: 'rgba(106, 146, 204, 0.28)',
          gutterBackground: '#212733',
          gutterText: '#6f7f9b',
        }
      : {
          background: '#fbfcfe',
          text: '#2f3542',
          caret: '#4d6f9f',
          border: '#cad4e5',
          activeLine: 'rgba(77, 111, 159, 0.06)',
          selection: 'rgba(122, 156, 205, 0.22)',
          gutterBackground: '#f2f5fa',
          gutterText: '#8d99aa',
        }

  return EditorView.theme({
    '&': {
      color: palette.text,
      backgroundColor: palette.background,
    },
    '.cm-content': {
      caretColor: palette.caret,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: palette.caret,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: palette.selection,
    },
    '.cm-activeLine': {
      backgroundColor: palette.activeLine,
    },
    '.cm-gutters': {
      backgroundColor: palette.gutterBackground,
      color: palette.gutterText,
      borderRight: `1px solid ${palette.border}`,
    },
  })
}

export function createDiffCodeHighlightStyle(colorScheme: DiffEditorColorScheme) {
  const palette =
    colorScheme === 'dark'
      ? {
          keyword: '#ff7b72',
          string: '#a5d6ff',
          number: '#79c0ff',
          atom: '#79c0ff',
          property: '#ffa657',
          punctuation: '#e6edf3',
          comment: '#8b949e',
        }
      : {
          keyword: '#cf222e',
          string: '#0a3069',
          number: '#0550ae',
          atom: '#0550ae',
          property: '#953800',
          punctuation: '#1f2328',
          comment: '#6e7781',
        }

  const style = HighlightStyle.define([
    { tag: [tags.keyword, tags.operatorKeyword], color: palette.keyword },
    { tag: [tags.string, tags.special(tags.string)], color: palette.string },
    { tag: [tags.number, tags.integer, tags.float], color: palette.number },
    { tag: [tags.bool, tags.null, tags.atom], color: palette.atom },
    { tag: [tags.propertyName, tags.attributeName], color: palette.property },
    {
      tag: [
        tags.punctuation,
        tags.brace,
        tags.bracket,
        tags.squareBracket,
        tags.separator,
        tags.derefOperator,
      ],
      color: palette.punctuation,
    },
    { tag: tags.comment, color: palette.comment, fontStyle: 'italic' },
  ])

  return syntaxHighlighting(style)
}

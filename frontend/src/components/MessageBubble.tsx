/** A user turn, right-aligned with a visible role and a neutral surface. */
import { useState } from 'react'
import { PencilIcon } from './Icon'
import { useT } from '../i18n/context'

interface Props {
  text: string
  /**
   * Put this question back in the composer (spec 026).
   *
   * It sends nothing. A question that came out wrong could only be fixed by retyping it, and the
   * text is already on screen — this is the control that says so. Absent while a turn is streaming
   * and when the conversation cannot be continued.
   */
  onEdit?: () => void
}

/**
 * Past this a question folds (assessment 2026-10-15): a pasted log took the whole screen. Lines
 * and characters both, because one 5000-character line is as long as forty short ones.
 */
const FOLD_LINES = 12
const FOLD_CHARS = 1200

/** The visible start of a long question, or `null` when it is short enough to show whole. */
function folded(text: string): string | null {
  const lines = text.split('\n')
  if (lines.length <= FOLD_LINES && text.length <= FOLD_CHARS) return null
  return `${lines.slice(0, FOLD_LINES).join('\n').slice(0, FOLD_CHARS)}…`
}

export function MessageBubble({ text, onEdit }: Props) {
  const s = useT()
  const [open, setOpen] = useState(false)
  const short = folded(text)
  return (
    <div className="bubble-row">
      {onEdit && (
        <button
          type="button"
          className="bubble__edit"
          title={s('question.edit')}
          aria-label={s('question.edit')}
          onClick={onEdit}
        >
          <PencilIcon size={13} />
        </button>
      )}
      <div className="bubble__content">
        <span className="bubble__label">{s('turn.you')}</span>
        <p className="bubble" aria-label={s('turn.you')}>
          {short === null || open ? text : short}
        </p>
        {short !== null && (
          <button
            type="button"
            className="bubble__fold"
            aria-expanded={open}
            onClick={() => setOpen((was) => !was)}
          >
            {s(open ? 'question.showLess' : 'question.showMore')}
          </button>
        )}
      </div>
    </div>
  )
}

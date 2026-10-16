/**
 * A question as the person wrote it (assessment 2026-10-15).
 *
 * A pasted 550-line log rendered as one paragraph — the bubble collapsed every newline — and took
 * the whole screen. The line breaks are the person's, and a long paste folds behind a toggle.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MessageBubble } from './MessageBubble'
import { LangContext } from '../i18n/context'
import { t } from '../i18n/strings'

function show(text: string, lang: 'en' | 'pt' = 'en') {
  return render(
    <LangContext.Provider value={lang}>
      <MessageBubble text={text} />
    </LangContext.Provider>,
  )
}

const LOG = Array.from({ length: 40 }, (_, i) => `2026-10-15 line ${i + 1}`).join('\n')

describe('line breaks', () => {
  it('keeps the newlines the person typed', () => {
    const css = readFileSync(join(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8')
    const rule = css.slice(css.indexOf('\n.bubble {'), css.indexOf('}', css.indexOf('\n.bubble {')))

    expect(rule).toMatch(/white-space:\s*pre-wrap/)
  })
})

describe('a long question', () => {
  it('folds behind a named toggle and shows the whole text when opened', async () => {
    show(LOG)
    const toggle = screen.getByRole('button', { name: t('question.showMore', 'en') })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByLabelText(t('turn.you', 'en')).textContent).not.toContain('line 40')

    await userEvent.click(toggle)

    expect(screen.getByRole('button', { name: t('question.showLess', 'en') })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByLabelText(t('turn.you', 'en')).textContent).toContain('line 40')
  })

  it('names the toggle in Portuguese too', () => {
    show(LOG, 'pt')

    expect(screen.getByRole('button', { name: t('question.showMore', 'pt') })).toBeInTheDocument()
  })

  it('offers no toggle for a short question', () => {
    show('What time is it in Sao Paulo?')

    expect(screen.queryByRole('button', { name: t('question.showMore', 'en') })).toBeNull()
  })

  it('folds one very long line too', () => {
    show('x'.repeat(5000))

    expect(screen.getByRole('button', { name: t('question.showMore', 'en') })).toBeInTheDocument()
  })
})

/**
 * A screen with no hover (assessment 2026-10-15).
 *
 * Two things were written for a mouse. The copy controls on code blocks and tables sit at opacity 0
 * until hover — a phone never hovers, so they were invisible there — and the composer's
 * "Shift + Enter for a new line" hint names a key a touch keyboard does not have.
 *
 * jsdom applies no stylesheet, so this reads the rule, as `layout.test.ts` does.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(import.meta.dirname, 'app.css'), 'utf8')

/** Every `@media (hover: none)` block, brace-matched and joined. */
function noHover(): string {
  const blocks: string[] = []
  let at = css.indexOf('@media (hover: none)')
  while (at !== -1) {
    const open = css.indexOf('{', at)
    let depth = 0
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++
      if (css[i] === '}' && --depth === 0) {
        blocks.push(css.slice(open + 1, i))
        break
      }
    }
    at = css.indexOf('@media (hover: none)', at + 1)
  }
  return blocks.join('\n')
}

describe('without hover', () => {
  it('shows the copy controls of code blocks and tables', () => {
    const block = noHover()
    expect(block).toMatch(/\.code-block__copy[^{]*\{[^}]*opacity:\s*1/)
    expect(block).toMatch(/\.table-block__copy/)
  })

  it('hides the Shift + Enter hint', () => {
    expect(noHover()).toMatch(/\.composer__hint[^{]*\{[^}]*display:\s*none/)
  })
})

describe('an agent card with a long name (assessment 2026-10-15)', () => {
  // `globalpowerplataformaagent` ran under the ⓘ: the name stopped 64px from the edge and the two
  // corner controls take 62 — two pixels of air. The reserved space must clear them with a gap.
  const tokens = readFileSync(join(import.meta.dirname, '../../public/ds/colors_and_type.css'), 'utf8')
  const px = (name: string) => Number(new RegExp(`--${name}:\\s*(\\d+)px`).exec(tokens)?.[1])

  it('reserves more room than the corner controls take', () => {
    const rule = css.slice(css.indexOf('.agent-card__choose {'), css.indexOf('}', css.indexOf('.agent-card__choose {')))
    const calc = /padding-right:\s*calc\(([^;]*)\);/.exec(rule)?.[1] ?? ''
    const reserved = [...calc.matchAll(/var\(--([\w-]+)\)/g)].reduce((sum, m) => sum + px(m[1]), 0)
    // right offset + two 15px icons with --sp-1 padding on each side + the gap between them
    const controls = px('sp-3') + 2 * (15 + 2 * px('sp-1')) + px('sp-1')

    expect(reserved).toBeGreaterThanOrEqual(controls + px('sp-2'))
  })
})

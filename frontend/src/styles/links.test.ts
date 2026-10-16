/**
 * A link inside an answer (assessment 2026-10-15).
 *
 * `.markdown a` had no rule, so an answer's links rendered in the browser's own default blue,
 * `rgb(0, 0, 238)` — measured live on the dark theme's surface at about 1.6:1, against the 4.5:1 a
 * link needs as text. `--fg-link` already exists and `contrast.test.ts` already holds it to that
 * bar on both palettes; nothing pointed the answer's links at it.
 *
 * jsdom applies no stylesheet, so this reads the rule, as `layout.test.ts` does.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(import.meta.dirname, 'app.css'), 'utf8')

describe('links in an answer', () => {
  it('wear the link token rather than the browser default', () => {
    const rule = /\.markdown a\s*\{([^}]*)\}/.exec(css)
    expect(rule, 'no `.markdown a` rule in app.css').not.toBeNull()
    expect(rule![1]).toMatch(/color:\s*var\(--fg-link\)/)
  })
})

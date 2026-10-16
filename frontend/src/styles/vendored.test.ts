/**
 * Every file the vendored stylesheet asks for exists (assessment 2026-10-15).
 *
 * It declared three italic Poppins faces whose `.ttf` files were never vendored. The dev server
 * answered each request with `index.html`, and the browser logged "OTS parsing error: invalid
 * sfntVersion" on every page — the first four bytes of `<!DOCTYPE`, read as a font.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DS = join(import.meta.dirname, '../../public/ds')
const css = readFileSync(join(DS, 'colors_and_type.css'), 'utf8')

describe('the vendored stylesheet', () => {
  it('only references files that are in the repository', () => {
    const missing = [...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)]
      .map((m) => m[1])
      .filter((ref) => !/^(data:|https?:)/.test(ref))
      .filter((ref) => !existsSync(join(DS, ref)))

    expect(missing).toEqual([])
  })
})

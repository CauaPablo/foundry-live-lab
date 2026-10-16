# Vendored from the Dataside Design System — do not hand-edit

`colors_and_type.css` is a **verbatim copy** (except its font section — see *Fonts* below) of `colors_and_type.css` in the design-system project
`1795979c-8cd4-4e79-80b5-99201daee465` (*Dataside Design System*), read on **2026-09-04** through
the `DesignSync` MCP. When the design changes, re-import the file; never edit this copy
(constitution §4, and `docs/design-system.md`).

It lives in `public/` rather than `src/` precisely so it stays verbatim: Vite copies `public/`
byte-for-byte instead of rewriting its `url()` references, so the file needs no local adjustment to
build. `index.html` links it directly.

## Fonts

`fonts/` ships the three **latin** Poppins cuts this UI actually uses — 300 Light, 400 Regular,
600 SemiBold — under the exact filenames the vendored CSS references. They are the Poppins v24
latin subsets from `fonts.gstatic.com`, fetched on 2026-09-04 via the Google Fonts CSS API; the
design system ships the same three cuts under the same names.

**One deliberate local divergence (2026-10-15).** The design system's file also declares three
*italic* faces, and `.ttf` fallbacks for the three upright ones, pointing at files this repository
never shipped (a `.ttf` cut is roughly twenty times the weight of the subset `.woff2`, and this UI
renders no italic text of its own). Left in, every page that rendered emphasis requested them, got
`index.html` back from the dev server and logged an OTS parsing error. So the font section of this
copy declares only the three `.woff2` faces; everything else in the file is still verbatim, and
Markdown emphasis synthesises an oblique.

**When you re-import**, either remove those references again or vendor the real
`Poppins-*Italic.ttf` files from the design system — `src/styles/vendored.test.ts` fails on any
`url()` here that has no file, so the choice cannot be skipped silently.

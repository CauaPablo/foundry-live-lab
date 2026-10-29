// Regenerates the README's demo screenshots and docs/assets/demo-streaming-turn.gif from the replay.
//
// Every shot is the app as `just demo` serves it: recorded Foundry turns through the real BFF and the
// real normaliser, no Azure credential (spec 050). This script starts its own demo BFF and Vite on
// ports of their own, because the error shot needs a BFF it is allowed to stop.
//
// Needs ffmpeg on PATH, the backend's Python environment and the frontend's dependencies:
//
//   node docs/assets/demo-captures/capture.mjs
//
// PYTHON overrides the interpreter (default: backend/.venv, then .venv, then `python`). The voice
// shot is not here: the demo has no voice endpoint, so that one needs a live session.

import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..', '..')
const assets = resolve(here, '..')
const frontend = join(root, 'frontend')
const backend = join(root, 'backend')

const { chromium } = await import(pathToFileURL(join(frontend, 'node_modules', 'playwright', 'index.mjs')).href)

const BFF_PORT = 8300
const WEB_PORT = 5399
const WEB = `http://localhost:${WEB_PORT}`
const QUESTION = 'Que horas são em São Paulo, e o que a documentação do Foundry diz sobre hosted agents?'

const python =
  process.env.PYTHON ??
  [join(backend, '.venv', 'bin', 'python'), join(root, '.venv', 'bin', 'python')].find((p) => existsSync(p)) ??
  'python'

function start(command, args, options) {
  const child = spawn(command, args, { stdio: 'ignore', ...options })
  child.on('error', (error) => {
    throw error
  })
  return child
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 500))
  }
  throw new Error(`${url} never answered`)
}

const startBff = () =>
  start(python, ['-m', 'uvicorn', 'app.demo:create_demo_app', '--factory', '--port', String(BFF_PORT)], {
    cwd: backend,
    env: { ...process.env, FRONTEND_ORIGINS: WEB },
  })

let bff = startBff()
const vite = start('node', ['node_modules/vite/bin/vite.js', '--port', String(WEB_PORT), '--strictPort'], {
  cwd: frontend,
  env: { ...process.env, VITE_BFF_URL: `http://localhost:${BFF_PORT}` },
})

/** Ask the recorded question and wait until the turn has settled: usage only arrives with `done`. */
async function askAndSettle(page) {
  const composer = page.getByRole('textbox', { name: 'Ask the agent something' })
  await composer.fill(QUESTION)
  await composer.press('Enter')
  await page.getByText(/\d+ tokens/).first().waitFor({ timeout: 60_000 })
  await page.getByText('Idle', { exact: true }).waitFor()
}

/** The conversation follows the newest text; a shot of the whole turn starts at its question. */
async function scrollConversationToTop(page) {
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('*')) {
      if (element.scrollHeight > element.clientHeight + 4 && getComputedStyle(element).overflowY !== 'visible') {
        element.scrollTop = 0
      }
    }
  })
}

async function shot(page, name) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(assets, name) })
  console.log(`wrote docs/assets/${name}`)
}

const browser = await chromium.launch()
try {
  await waitFor(`http://localhost:${BFF_PORT}/health`)
  await waitFor(WEB)

  // The README's opening shot, the trace drawer and the event inspector: one turn, three views.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
    await page.goto(WEB)
    await askAndSettle(page)
    // Three or more calls fold into one line (spec 061); the README's caption counts the rows.
    await page.getByRole('button', { name: /4 tool calls/i }).click()
    await scrollConversationToTop(page)
    await shot(page, 'screenshot-chat.png')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Traces' }).click()
    await page.getByText(/invoke_agent/).first().waitFor({ timeout: 30_000 })
    await shot(page, 'screenshot-trace.png')

    // 1680px, where the inspector takes a column of its own beside the trace drawer (spec 038).
    await page.setViewportSize({ width: 1680, height: 940 })
    await page.getByRole('button', { name: 'Events' }).click()
    await page.getByText(/Foundry event names verified/).waitFor({ timeout: 30_000 })
    await shot(page, 'screenshot-events.png')
    await page.close()
  }

  // The agents screen, in both themes. Light is the default (spec 060).
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${WEB}/agents`)
    await page.getByRole('heading', { name: 'Agents' }).waitFor()
    await shot(page, 'screenshot-agents.png')
    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await shot(page, 'screenshot-dark.png')
    await page.close()
  }

  // 390px: a turn, then the rail open over it (spec 047), composed side by side.
  {
    const frames = mkdtempSync(join(tmpdir(), 'narrow-'))
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
    await page.goto(WEB)
    await askAndSettle(page)
    await scrollConversationToTop(page)
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(frames, 'turn.png') })
    await page.getByRole('button', { name: 'Open the menu' }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: join(frames, 'rail.png') })
    await page.close()
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', join(frames, 'turn.png'), '-i', join(frames, 'rail.png'),
      '-filter_complex', '[0]pad=iw+32:ih+40:20:20:color=0xEEF1F6[a];[1]pad=iw+32:ih+40:12:20:color=0xEEF1F6[b];[a][b]hstack',
      join(assets, 'screenshot-narrow.png'),
    ])
    console.log('wrote docs/assets/screenshot-narrow.png')
  }

  // A turn that failed: the BFF is stopped mid-session, on purpose (spec 003).
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(WEB)
    await askAndSettle(page)
    bff.kill()
    await new Promise((done) => bff.once('exit', done))
    const composer = page.getByRole('textbox', { name: 'Ask the agent something' })
    await composer.fill('E agora, com o BFF fora do ar?')
    await composer.press('Enter')
    const failed = page.getByText(/The turn failed/)
    await failed.waitFor({ timeout: 30_000 })
    await failed.evaluate((element) => element.scrollIntoView({ block: 'center' }))
    await shot(page, 'screenshot-error.png')
    await page.close()
    bff = startBff()
    await waitFor(`http://localhost:${BFF_PORT}/health`)
  }

  // One turn replaying, as a GIF: the browser's own recording of the page, through a palette.
  {
    const videos = mkdtempSync(join(tmpdir(), 'turn-video-'))
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: videos, size: { width: 1440, height: 900 } },
    })
    const page = await context.newPage()
    await page.goto(WEB)
    await page.waitForTimeout(800)
    await askAndSettle(page)
    await page.waitForTimeout(1500)
    await context.close()
    const video = join(videos, readdirSync(videos).find((f) => f.endsWith('.webm')))
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', video,
      // Slowed by half again so the stream can be read; the README says so.
      '-vf', 'setpts=1.5*PTS,fps=8,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
      join(assets, 'demo-streaming-turn.gif'),
    ])
    console.log('wrote docs/assets/demo-streaming-turn.gif')
  }
} finally {
  await browser.close()
  bff.kill()
  vite.kill()
}

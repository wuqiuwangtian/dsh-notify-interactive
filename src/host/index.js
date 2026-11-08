/**
 * Host half.
 *
 * It observes committed session events and, when no web client is present,
 * shows a Windows popup reminder through PowerShell. It never answers an
 * approval or question: the fallback is reminder-only.
 *
 * The web client reports presence and asks this half for the same fallback
 * when its interactive popup cannot be opened.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { messageForEvent, popupPayload, popupScript, shouldAutoNotify, truncate } from './logic.js'

const PRESENCE_PATH = '/dsh-notify-interactive/presence'
const WINDOWS_PATH = '/dsh-notify-interactive/windows-notify'
const WSL_POWERSHELL = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
const NOTIFY_COOLDOWN_MS = 2000

let warnedMissingPowerShell = false

function resolvePowerShell() {
  if (process.platform === 'win32') return 'powershell.exe'
  if (existsSync(WSL_POWERSHELL)) return WSL_POWERSHELL
  return undefined
}

/** Show one native WinForms reminder. Detached so the host never waits. */
function showWindowsPopup(title, body, silent = false, url = '') {
  const executable = resolvePowerShell()
  if (executable === undefined) {
    if (!warnedMissingPowerShell) {
      warnedMissingPowerShell = true
      console.warn('[dsh-notify-interactive] Windows popup fallback unavailable: PowerShell was not found.')
    }
    return false
  }
  try {
    const script = popupScript(popupPayload(
      title,
      body,
      silent,
      typeof url === 'string' && url !== '' ? url : (process.env.DSH_WEB_URL ?? ''),
    ))
    const encoded = Buffer.from(script, 'utf16le').toString('base64')
    const child = spawn(executable, [
      '-NoProfile',
      '-WindowStyle',
      'Hidden',
      '-EncodedCommand',
      encoded,
    ], {
      detached: true,
      stdio: 'ignore',
    })
    child.on('error', () => {})
    child.unref()
    return true
  } catch {
    return false
  }
}

function readJson(req, limit = 16_384) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function writeJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(value))
}

/**
 * Install the host half.
 * @param {object} ctx Host Cordis context.
 */
export function apply(ctx) {
  let lastPresence = null
  const lastNotify = new Map()

  function notifyOnce(sessionId, kind, title, body, silent = false, url = '') {
    const now = Date.now()
    const key = `${sessionId}:${kind}`
    const last = lastNotify.get(key)
    if (last !== undefined && now - last < NOTIFY_COOLDOWN_MS) return false
    lastNotify.set(key, now)
    if (lastNotify.size > 200) {
      for (const [entryKey, at] of lastNotify) {
        if (now - at > 10 * 60 * 1000) lastNotify.delete(entryKey)
      }
    }
    return showWindowsPopup(title, body, silent, url)
  }

  async function presenceRoute(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end()
      return
    }
    try {
      const body = await readJson(req)
      lastPresence = {
        at: Date.now(),
        active: body?.active !== false,
        sessionId: typeof body?.sessionId === 'string' ? body.sessionId : undefined,
        focused: body?.focused === true,
        visible: body?.visible === true,
      }
      res.writeHead(204)
      res.end()
    } catch {
      res.writeHead(400)
      res.end()
    }
  }

  async function windowsRoute(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end()
      return
    }
    try {
      const body = await readJson(req)
      const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : 'web'
      const kind = typeof body?.kind === 'string' ? body.kind : 'notice'
      const title = truncate(body?.title ?? 'DSH', 80)
      const text = truncate(body?.body ?? '', 500)
      const requestedUrl = typeof body?.url === 'string' && /^https?:\/\//.test(body.url)
        ? body.url
        : (process.env.DSH_WEB_URL ?? '')
      const shown = notifyOnce(sessionId, kind, title, text, body?.silent === true, requestedUrl)
      writeJson(res, 200, { shown })
    } catch {
      res.writeHead(400)
      res.end()
    }
  }

  ctx.inject(['webServer'], (scope) => {
    scope.effect(() => scope.webServer.register({
      kind: 'exact',
      path: PRESENCE_PATH,
      handler: presenceRoute,
    }), 'dsh-notify-interactive: presence route')
    scope.effect(() => scope.webServer.register({
      kind: 'exact',
      path: WINDOWS_PATH,
      handler: windowsRoute,
    }), 'dsh-notify-interactive: windows fallback route')
  })

  ctx.on('session/event', (session, event) => {
    if (!shouldAutoNotify(lastPresence)) return
    const message = messageForEvent(session, event)
    if (message === null) return
    notifyOnce(String(session.id), message.kind, message.title, message.body)
  })

  ctx.effect(() => () => {
    lastPresence = null
    lastNotify.clear()
  }, 'dsh-notify-interactive: host runtime')
}

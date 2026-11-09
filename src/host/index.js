/** Host coordinator: profile preferences, authenticated Web requests, event claims and desktop delivery.
 * It only observes session/event; no answer waterfall is registered or intercepted.
 */

import { join } from 'node:path'
import { createPreferences } from './preferences.js'
import { createCoordinator } from './coordinator.js'
import { channelPolicy, deliverNotification } from './delivery.js'
import { createCompanion, getCompanionStatus } from './companion.js'
import { renderPresetToDataUrl } from '../audio/wav.js'
import { SOUND_PRESETS } from '../audio/sounds.js'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { messageForEvent, popupPayload, popupScript, truncate } from './logic.js'

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
function showWindowsPopup(title, body, silent = false, url = '', popup = true) {
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
      typeof url === 'string' && url !== '' ? url : (process.env.DSH_WEB_URL ?? ''), popup,
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
export function applyHost(ctx, services = {}) {
  const coordinator = createCoordinator()
  const timers = new Set()
  let profile
  try { profile = ctx.get?.('profileContext') ?? ctx.profileContext } catch { /* Profiles are optional in test/native embeddings. */ }
  const preferences = createPreferences(profile?.dir ? join(profile.dir, 'notify-interactive.settings.json') : undefined)
  let presentation = null
  function authorize(req, res) {
    try {
      const connection = ctx.get?.('connection') ?? ctx.connection
      const rejection = connection?.requestRejection(req) ?? (connection ? undefined : 503)
      if (rejection === undefined && connection.admit(req)?.peer?.principal?.kind === 'owner') return true
      if (rejection === undefined) { writeJson(res, 403, { error: 'owner-required' }); return false }
      writeJson(res, rejection, { error: 'not-authorized' })
    } catch { writeJson(res, 503, { error: 'connection-unavailable' }) }
    return false
  }

  const lastNotify = new Map()
  const companion = services.companion ?? createCompanion()
  const legacy = services.legacy ?? showWindowsPopup
  let companionWarning = ''

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
    return legacy(title, body, silent, url)
  }

  async function presenceRoute(req, res) {
    if (!authorize(req, res)) return
    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end()
      return
    }
    try {
      const body = await readJson(req)
      coordinator.present(body)
      const view = body.presentation
      if (view && typeof view.url === 'string' && /^https?:\/\//.test(view.url)) {
        const url = new URL(view.url)
        if (!url.username && !url.password) presentation = { url: url.origin, theme: view.theme ?? {}, openLabel: truncate(view.openLabel ?? 'DSH', 80), closeLabel: truncate(view.closeLabel ?? 'Close', 80) }
      }
      if (body.focused && body.visible) for (const fact of coordinator.deliveredFor(body.sessionId)) { void companion.withdraw?.(fact.id); void companion.silence?.(fact.id) }
      res.writeHead(204)
      res.end()
    } catch {
      res.writeHead(400)
      res.end()
    }
  }

  async function windowsRoute(req, res) {
    if (!authorize(req, res)) return
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
      // Older already-open pages still use this route; share the same host claim.
      if (coordinator.resolve(sessionId, kind, body.callId) && requestedUrl) {
        const { status, ...result } = await dispatch({ ...body, sessionId, kind, url: requestedUrl }, true)
        writeJson(res, status, result)
        return
      }
      if (getCompanionStatus().enabled && ['completion', 'demo-completion', 'demo-approval', 'demo-question', 'demo-plan-review'].includes(kind) && requestedUrl) {
        const url = new URL(requestedUrl)
        url.searchParams.set('dsh-notify-session', sessionId)
        const sound = body?.sound ?? {}
        const preset = SOUND_PRESETS.find(item => item.id === sound.preset)
        const audio = body?.silent === true || sound.enabled === false || !preset ? '' : renderPresetToDataUrl(preset)
        const sessionTitle = truncate(body?.sessionTitle ?? '', 200)
        const prefix = `${sessionTitle} · `
        const desktopBody = sessionTitle && text.startsWith(prefix) ? text.slice(prefix.length) : text
        const result = await companion.deliver({
          title, sessionTitle, body: desktopBody, url: url.href, popup: true,
          openLabel: truncate(body?.openLabel ?? 'DSH', 80), closeLabel: truncate(body?.closeLabel ?? 'Close', 80), theme: body?.theme ?? {},
          audio, volume: Number.isFinite(sound.volume) ? Math.max(0, Math.min(1, sound.volume)) : 0.7,
        })
        if (result.status === 'rendered') companionWarning = ''
        if (['rendered', 'uncertain', 'queued'].includes(result.status)) {
          writeJson(res, 200, { shown: result.status === 'rendered', delivery: result.status })
          return
        }
        if (companionWarning !== result.reason) {
          companionWarning = result.reason
          console.warn('[dsh-notify-interactive] companion fallback:', result.reason)
        }
      }
      const shown = notifyOnce(sessionId, kind, title, text, body?.silent === true, requestedUrl)
      writeJson(res, 200, { shown, delivery: shown ? 'process-started' : 'unavailable' })
    } catch {
      res.writeHead(400)
      res.end()
    }
  }

  async function settingsRoute(req, res) {
    if (!authorize(req, res)) return
    try {
      if (req.method === 'GET') { res.setHeader?.('cache-control', 'no-store'); writeJson(res, 200, await preferences.snapshot()); return }
      if (req.method !== 'POST') { writeJson(res, 405, { error: 'method' }); return }
      const body = await readJson(req, 64000)
      const next = await preferences.update(body.revision, body.patch, body.initial)
      if (!next.conflict) for (const fact of coordinator.deliveredFor()) {
        const policy = channelPolicy(next.settings, fact.kind)
        if (!policy.popup) void companion.withdraw?.(fact.id)
        if (!policy.sound) void companion.silence?.(fact.id)
      }
      writeJson(res, next.conflict ? 409 : 200, next)
    } catch { writeJson(res, 503, { error: 'preferences-unavailable' }) }
  }

  async function dispatch(body, legacyClient = false) {
    if (typeof body.sessionId !== 'string' || !['approval', 'question', 'plan-review', 'completion'].includes(body.kind)) return { status: 400, shown: false, delivery: 'invalid-event' }
    const url = new URL(body.url)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return { status: 400, shown: false, delivery: 'invalid-url' }
    const fact = coordinator.resolve(body.sessionId, body.kind, body.callId)
    if (!fact) return { status: 409, shown: false, delivery: 'event-not-current' }
    presentation = { theme: body.theme ?? {}, url: body.url, openLabel: body.openLabel, closeLabel: body.closeLabel }
    if (coordinator.attended(body.sessionId) && !coordinator.attended(body.sessionId, fact.at)) await new Promise(resolve => setTimeout(resolve, 1100))
    const { settings } = await preferences.snapshot()
    if (!coordinator.claim(fact)) return { status: 200, shown: false, delivery: 'duplicate' }
    const policy = channelPolicy(settings, body.kind, coordinator.attended(body.sessionId, fact.at))
    if (legacyClient && body.silent) policy.sound = false
    url.searchParams.set('dsh-notify-session', body.sessionId)
    const sessionTitle = truncate(body.sessionTitle ?? '', 200)
    const text = truncate(body.body ?? '', 500)
    const prefix = `${sessionTitle} · `
    const result = await deliverNotification({ companion, available: services.available ?? getCompanionStatus().enabled,
      legacy, policy,
      getPolicy: () => { const value = channelPolicy(preferences.current(), body.kind, coordinator.attended(body.sessionId, fact.at)); if (legacyClient && body.silent) value.sound = false; return value },
      isCurrent: () => coordinator.resolve(body.sessionId, body.kind, body.callId)?.id === fact.id,
      payload: { eventId: fact.id, sticky: body.kind !== 'completion', title: truncate(body.title ?? 'DSH', 80), sessionTitle,
        body: sessionTitle && text.startsWith(prefix) ? text.slice(prefix.length) : text,
        url: url.href, theme: body.theme ?? {}, openLabel: truncate(body.openLabel ?? 'DSH', 80), closeLabel: truncate(body.closeLabel ?? 'Close', 80), webPopup: body.webPopup === true },
    })
    coordinator.finish(fact, result.delivery)
    return { status: 200, ...result }
  }
  async function coordinatedDelivery(req, res) {
    if (!authorize(req, res)) return
    if (req.method !== 'POST') { writeJson(res, 405, { error: 'method' }); return }
    try {
      const { status, ...result } = await dispatch(await readJson(req, 64000))
      writeJson(res, status, result)
    } catch { writeJson(res, 503, { shown: false, delivery: 'failed' }) }
  }

  ctx.inject(['webServer'], (scope) => {
    for (const [path, handler] of [['settings', settingsRoute], ['deliver', coordinatedDelivery]]) {
      scope.effect(() => scope.webServer.register({ kind: 'exact', path: `/dsh-notify-interactive/${path}`, handler }), `dsh-notify-interactive: ${path}`)
    }
    scope.effect(() => scope.webServer.register({
      kind: 'exact',
      path: '/dsh-notify-interactive/desktop-status',
      handler(req, res) {
        if (!authorize(req, res)) return
        if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
        res.setHeader?.('cache-control', 'no-store')
        writeJson(res, 200, getCompanionStatus())
      },
    }), 'dsh-notify-interactive: desktop status')
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
    const before = ['approval', 'question', 'plan-review', 'completion'].map(kind => coordinator.resolve(session.id, kind)).filter(Boolean)
    const message = messageForEvent(session, event)
    const fact = coordinator.observe(session, event, message)
    for (const old of before) if (coordinator.resolve(session.id, old.kind)?.id !== old.id) { void companion.withdraw?.(old.id); void companion.silence?.(old.id) }
    if (!fact) return
    const timer = setTimeout(async () => {
      timers.delete(timer)
      if (!coordinator.pending(fact)) return
      try {
        const { settings } = await preferences.snapshot()
        const policy = channelPolicy(settings, message.kind, coordinator.attended(session.id, fact.at))
        if (!coordinator.claim(fact)) return
        const base = presentation?.url || process.env.DSH_WEB_URL || ''
        const url = base ? new URL(base) : null
        url?.searchParams.set('dsh-notify-session', String(session.id))
        const payload = { eventId: fact.id, sticky: message.kind !== 'completion', title: message.title, sessionTitle: '', body: message.body,
          url: url?.href ?? 'http://localhost/', theme: presentation?.theme ?? {},
          openLabel: presentation?.openLabel ?? 'DSH', closeLabel: presentation?.closeLabel ?? 'Close' }
        const result = await deliverNotification({ companion, policy,
          available: Boolean(presentation) && (services.available ?? getCompanionStatus().enabled),
          legacy, payload,
          getPolicy: () => channelPolicy(preferences.current(), message.kind, coordinator.attended(session.id, fact.at)),
          isCurrent: () => coordinator.resolve(session.id, message.kind)?.id === fact.id })
        coordinator.finish(fact, result.delivery)
      } catch { console.warn('[dsh-notify-interactive] host delivery failed') }
    }, services.deliveryDelayMs ?? 1800)
    timers.add(timer)
    timer.unref?.()
  })

  ctx.effect(() => () => {
    for (const timer of timers) clearTimeout(timer)
    coordinator.clear()
    companion.dispose()
    lastNotify.clear()
  }, 'dsh-notify-interactive: host runtime')
}

export function apply(ctx) { return applyHost(ctx) }

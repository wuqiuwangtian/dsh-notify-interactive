/** Host coordinator: profile preferences, authenticated Web requests, event claims and desktop delivery.
 * It only observes session/event; no answer waterfall is registered or intercepted.
 */

import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { createPreferences } from './preferences.js'
import { createCoordinator } from './coordinator.js'
import { createToastTransport, notificationProfileId, windowsShell } from './windows-toast.js'
import { channelPolicy } from './delivery.js'
import { createInteractionBroker } from './interactions.js'
import { existsSync } from 'node:fs'
import { messageForEvent, truncate } from './logic.js'

const PRESENCE_PATH = '/dsh-notify-interactive/presence'
const WINDOWS_PATH = '/dsh-notify-interactive/windows-notify'

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
  let native = services.transport
  let reason = 'missing-origin'
  function desktopStatus() {
    return { scope: 'reminders', native: true, enabled: reason !== 'disabled', available: Boolean(native),
      reason: native ? native.reason?.() : reason, profileId: profile?.dir ? notificationProfileId(profile.dir) : native?.profileId }
  }
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

  const interactions = createInteractionBroker({ coordinator, onUpdate: (id, view) => native?.update?.(id, view) })
  const interactionSweep = setInterval(() => interactions.sweep(), 1000)
  interactionSweep.unref?.()

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
      const sessionId = body?.sessionId
      if (typeof sessionId !== 'string' || !sessionId) { writeJson(res, 400, { delivery: 'missing-session' }); return }
      const kind = typeof body?.kind === 'string' ? body.kind : 'notice'
      const title = truncate(body?.title ?? 'DSH', 80)
      const text = truncate(body?.body ?? '', 500)
      if (coordinator.resolve(sessionId, kind, body.callId)) {
        const { status, ...result } = await dispatch(body, true)
        writeJson(res, status, result)
        return
      }
      if (kind !== 'demo-completion') { writeJson(res, 409, { delivery: 'event-not-current' }); return }
      if (!native) { writeJson(res, 503, { delivery: reason }); return }
      await preferences.snapshot()
      try {
        const result = await native.deliver({ fact: { kind: 'completion', id: `demo-${randomUUID()}`, sessionId },
          payload: { sessionTitle: truncate(body.sessionTitle ?? '', 200), title, body: text },
          getPolicy: () => channelPolicy(preferences.current(), 'completion'), isCurrent: () => true })
        writeJson(res, 200, result)
      } catch { writeJson(res, 503, { delivery: 'failed' }) }
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
        if (!policy.popup) native?.retire(fact)
      }
      writeJson(res, next.conflict ? 409 : 200, next)
    } catch { writeJson(res, 503, { error: 'preferences-unavailable' }) }
  }

  function interactionRoute(operation) {
    return async (req, res) => {
      if (!authorize(req, res)) return
      if (req.method !== 'POST') { writeJson(res, 405, { error: 'method' }); return }
      try {
        const body = await readJson(req, 192000)
        res.setHeader?.('cache-control', 'no-store')
        if (operation === 'sync') { writeJson(res, 200, interactions.sync(body.clientId, body.registrations)); return }
        if (body.instanceId !== interactions.instanceId) { writeJson(res, 409, { error: 'instance-changed' }); return }
        if (operation === 'execute') writeJson(res, 200, { allowed: interactions.execute(body.clientId, body.id, body.token, body.eventId) })
        else writeJson(res, 200, { accepted: interactions.result(body.clientId, body.id, body.status) })
      } catch { writeJson(res, 400, { error: 'invalid-interaction' }) }
    }
  }

  function eventPolicy(settings, fact) {
    return channelPolicy(settings, fact.kind, coordinator.attended(fact.sessionId, fact.at), coordinator.attended(undefined, fact.at))
  }

  async function dispatch(body, legacyClient = false) {
    if (typeof body.sessionId !== 'string' || !['approval', 'question', 'plan-review', 'completion'].includes(body.kind)) return { status: 400, shown: false, delivery: 'invalid-event' }
    if (!native) return { status: 503, shown: false, delivery: reason }
    const fact = coordinator.resolve(body.sessionId, body.kind, body.callId)
    if (!fact) return { status: 409, shown: false, delivery: 'event-not-current' }
    const focusTarget = fact.kind === 'completion' && preferences.current().popup.completionMode === 'window-away' ? undefined : body.sessionId
    // A newly foreground tab may not have posted its first view change yet.
    const grace = fact.at + 1250 - Date.now()
    if (grace > 0 && !coordinator.attended(focusTarget, fact.at)) {
      await new Promise(resolve => setTimeout(resolve, grace))
    }
    await preferences.snapshot()
    if (!coordinator.claim(fact)) return { status: 200, shown: false, delivery: 'duplicate' }
    const sessionTitle = truncate(body.sessionTitle ?? '', 200)
    const text = truncate(body.body ?? '', 500)
    const prefix = `${sessionTitle} · `
    const result = await native.deliver({ fact, getInteraction: () => interactions.presentation(fact.id),
      getPolicy: () => {
        const value = eventPolicy(preferences.current(), fact)
        if (legacyClient && body.silent) value.sound = false
        return value
      },
      isCurrent: () => fact.kind === 'completion' || coordinator.resolve(body.sessionId, body.kind, body.callId)?.id === fact.id,
      payload: { title: truncate(body.title ?? 'DSH', 80), sessionTitle,
        body: fact.completionReason && fact.completionReason !== 'completed' ? fact.message.body
          : sessionTitle && text.startsWith(prefix) ? text.slice(prefix.length) : text },
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
    if (!services.transport) {
      const disabled = (process.env.DSH_NOTIFY_WINDOWS ?? process.env.DSH_NOTIFY_COMPANION) === '0'
      if (disabled) reason = 'disabled'
      else if (!existsSync(windowsShell)) reason = 'missing-windows'
      else if (profile?.dir) {
        try {
          const origin = process.env.DSH_NOTIFY_WINDOWS_ORIGIN ?? scope.webServer.getOrigin()
          const target = new URL(origin)
          if (!['http:', 'https:'].includes(target.protocol) || target.href !== target.origin + '/') throw Error('invalid-origin')
          native = createToastTransport(target.origin, profile.dir, undefined, packet => interactions.submit(packet))
        } catch { reason = 'missing-origin' }
      }
      scope.effect(() => () => { native?.dispose(); native = undefined }, 'dsh-notify-interactive: Windows transport')
    }
    for (const [path, handler] of [['settings', settingsRoute], ['deliver', coordinatedDelivery], ['interactions', interactionRoute('sync')], ['interaction-execute', interactionRoute('execute')], ['interaction-result', interactionRoute('result')]]) {
      scope.effect(() => scope.webServer.register({ kind: 'exact', path: `/dsh-notify-interactive/${path}`, handler }), `dsh-notify-interactive: ${path}`)
    }
    scope.effect(() => scope.webServer.register({
      kind: 'exact',
      path: '/dsh-notify-interactive/desktop-status',
      handler(req, res) {
        if (!authorize(req, res)) return
        if (req.method !== 'GET') { res.writeHead(405); res.end(); return }
        res.setHeader?.('cache-control', 'no-store')
        writeJson(res, 200, desktopStatus())
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
    interactions.observe(fact)
    for (const old of before) {
      if (coordinator.resolve(session.id, old.kind)?.id === old.id) continue
      native?.retire(old)
    }
    if (!fact || !native) return
    const timer = setTimeout(async () => {
      timers.delete(timer)
      const keepCompletion = fact.kind === 'completion'
      if (!(keepCompletion ? coordinator.waiting(fact) : coordinator.pending(fact))) return
      try {
        await preferences.snapshot()
        if (!native || !coordinator.claim(fact)) return
        const result = await native.deliver({ fact, payload: { title: message.title, body: message.body },
          getInteraction: () => interactions.presentation(fact.id),
          getPolicy: () => eventPolicy(preferences.current(), fact),
          isCurrent: () => keepCompletion || coordinator.resolve(session.id, message.kind)?.id === fact.id })
        coordinator.finish(fact, result.delivery)
      } catch { console.warn('[dsh-notify-interactive] host delivery failed') }
    }, services.deliveryDelayMs ?? 1800)
    timers.add(timer)
    timer.unref?.()
  })

  ctx.effect(() => () => {
    for (const timer of timers) clearTimeout(timer)
    clearInterval(interactionSweep)
    interactions.dispose()
    coordinator.clear()
  }, 'dsh-notify-interactive: host runtime')
}

export function apply(ctx) { return applyHost(ctx) }

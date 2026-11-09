import { presentationOf, presentationKey, validAnswer } from '../interaction/schema.js'

/** References stay in this page. Only display data and explicit commands cross the bridge. */
export function createInteractionBridge({ clientId, getStatus, resolveText, fetch = globalThis.fetch, intervalMs = 500, makeToken = () => globalThis.crypto.randomUUID() }) {
  const references = new Map(), seen = new Set()
  let instanceId, timer, running = false, stopped = false, inflight
  const post = async (path, data) => {
    const response = await fetch(`/dsh-notify-interactive/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ clientId, ...data }) })
    if (!response.ok) throw new Error('bridge-unavailable')
    return response.json()
  }
  function registrations() {
    const live = new Set(), rows = []
    let bytes = 0
    for (const [sessionId, status] of getStatus() ?? []) {
      const pending = status.pendingInteraction
      const view = presentationOf(pending, resolveText)
      if (!view) continue
      bytes += JSON.stringify(view).length
      if (rows.length >= 128 || bytes > 130000) break
      let ref = references.get(pending)
      if (!ref) { ref = { token: makeToken(), pending, sessionId, key: pending.key }; references.set(pending, ref) }
      live.add(pending)
      rows.push({ sessionId: String(sessionId), token: ref.token, view })
    }
    for (const [pending, ref] of references) if (!live.has(pending)) {
      // Release only focus this bridge acquired; closing a reminder never cancels a request.
      if (ref.focused) pending.releaseFocus?.()
      references.delete(pending)
    }
    return rows
  }
  function current(command) {
    const ref = [...references.values()].find(value => value.token === command.token)
    if (!ref || ref.pending.key !== ref.key || String(ref.sessionId) !== command.sessionId || ref.eventId !== command.eventId || instanceId !== command.instanceId ||
      getStatus()?.get(ref.sessionId)?.pendingInteraction !== ref.pending) return null
    const view = presentationOf(ref.pending, resolveText)
    if (!view || presentationKey(view) !== command.viewKey || (command.action === 'answer' && !validAnswer(view, command.answer))) return null
    return ref
  }
  async function handle(command) {
    if (seen.has(command.id)) return
    seen.add(command.id)
    if (seen.size > 512) seen.delete(seen.values().next().value)
    let status = 'unavailable'
    try {
      if (current(command)) {
        const allowed = await post('interaction-execute', { id: command.id, token: command.token, eventId: command.eventId, instanceId })
        // Network waits can replace or settle the Pending object. Recheck at the actual call site.
        const ref = allowed.allowed ? current(command) : null
        if (ref && !stopped) {
          const pending = ref.pending
          if (command.action === 'answer') {
            status = 'uncertain'
            await pending.answer(command.answer)
            if (pending.kind !== 'approval' && pending.snapshot?.().channel === 'rpc') {
              // Hide only after successful native submission, as the DSH composer does.
              try { await pending.dismiss?.() } catch { /* The seat may already be gone. */ }
            }
          } else if (command.action === 'focus') { pending.holdFocus?.(); ref.focused = true; ref.focusedAt = Date.now() }
          else if (command.action === 'blur') { pending.releaseFocus?.(); ref.focused = false }
          else if (command.action === 'engage') pending.engage?.()
          else if (command.action === 'take-time') pending.takeTime?.()
          status = 'success'
        }
      }
    } catch { /* Never replay a user answer on transport failure or ambiguous settlement. */ }
    try { await post('interaction-result', { id: command.id, status, instanceId }) } catch { /* Host timeout reports uncertainty; no resubmission. */ }
  }
  async function sync() {
    if (stopped) return
    if (running) return inflight
    for (const ref of references.values()) if (ref.focused && Date.now() - ref.focusedAt > 8000) { ref.pending.releaseFocus?.(); ref.focused = false }
    running = true
    inflight = (async () => {
      try {
        const response = await post('interactions', { registrations: registrations() })
        if (stopped) return
        if (instanceId && instanceId !== response.instanceId) {
          // A host restart changes the authorization epoch. Bind again on a later poll.
          for (const ref of references.values()) ref.eventId = undefined
        }
        instanceId = response.instanceId
        for (const binding of response.bindings ?? []) {
          const ref = [...references.values()].find(value => value.token === binding.token)
          if (ref && (!ref.eventId || ref.eventId === binding.eventId)) ref.eventId = binding.eventId
        }
        for (const command of response.commands ?? []) await handle(command)
      } catch { /* Auth/disconnect makes this page unavailable; ordinary reminders still work. */ }
      finally { running = false }
    })()
    return inflight
  }
  return { sync,
    start() { stopped = false; void sync(); timer = setInterval(() => void sync(), intervalMs) },
    reset() { for (const ref of references.values()) if (ref.focused) ref.pending.releaseFocus?.(); references.clear(); instanceId = undefined },
    stop() { stopped = true; clearInterval(timer); for (const ref of references.values()) if (ref.focused) ref.pending.releaseFocus?.(); references.clear() },
  }
}

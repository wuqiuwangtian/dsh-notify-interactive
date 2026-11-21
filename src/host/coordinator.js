import { PRESENCE_TTL_MS } from './logic.js'
import { questionsKey } from '../interaction/schema.js'

/** One host owns event identity, attention and the delivery claim across Web tabs. */
export function createCoordinator({ now = Date.now, ttl = PRESENCE_TTL_MS } = {}) {
  const peers = new Map()
  const facts = new Map()
  const events = new Map()
  const keyOf = (sessionId, kind) => JSON.stringify([String(sessionId), kind])
  function present(value) {
    const id = typeof value.clientId === 'string' ? value.clientId : 'legacy'
    if (value.active === false) { peers.delete(id); return }
    peers.set(id, { ...value, at: now() })
    for (const [key, peer] of peers) if (now() - peer.at > ttl) peers.delete(key)
    while (peers.size > 64) peers.delete(peers.keys().next().value)
  }
  function attended(sessionId, since = 0) {
    return [...peers.values()].some(peer => peer.at >= since && now() - peer.at <= ttl && peer.focused && peer.visible && (sessionId === undefined || String(peer.sessionId) === String(sessionId)))
  }
  function observe(session, event, message) {
    const sessionId = String(session.id)
    if (event.type === 'user/message' && event.data?.source?.kind === 'user-question-reply') {
      for (const kind of ['question', 'plan-review']) {
        const fact = facts.get(keyOf(sessionId, kind))
        if (fact?.callId === event.data.source.callId) facts.delete(keyOf(sessionId, kind))
      }
      return
    }
    if (event.type === 'tool/result') {
      const result = event.data?.message
      const callId = result?.toolCallId ?? result?.source?.callId ?? event.data?.callId
      const content = typeof result?.content === 'string' ? result.content : Array.isArray(result?.content)
        ? result.content.filter(block => block.type === 'text').map(block => block.text).join('') : ''
      let continued = false
      try { continued = JSON.parse(content).pending === true } catch { /* Non-question results are ordinary tool text. */ }
      if (!continued) for (const kind of ['approval', 'question', 'plan-review']) {
        const fact = facts.get(keyOf(sessionId, kind))
        if (fact?.callId && String(fact.callId) === String(callId)) facts.delete(keyOf(sessionId, kind))
      }
      return
    }
    if (event.type === 'approval/decided') {
      const fact = facts.get(keyOf(sessionId, 'approval'))
      if (fact && fact.id === JSON.stringify([sessionId, 'approval', event.data?.id])) facts.delete(keyOf(sessionId, 'approval'))
      return
    }
    if (event.type === 'turn/end' && event.data?.reason?.kind === 'aborted') { facts.delete(keyOf(sessionId, 'completion')); return }
    if (event.type === 'turn/start') { facts.delete(keyOf(sessionId, 'completion')); return }
    if (!message) return
    const data = event.data ?? {}
    const identity = message.kind === 'completion' ? data.turn : message.kind === 'approval' ? data.id : data.callId
    if (identity === undefined) return
    const id = JSON.stringify([sessionId, message.kind, identity])
    if (events.has(id)) return events.get(id).fact
    let questionKey = ''
    if (message.kind === 'question') {
      try { questionKey = questionsKey(JSON.parse(data.arguments).questions) } catch { /* Unparseable requests remain reminder-only. */ }
    }
    const fact = { id, sessionId, kind: message.kind, callId: data.callId, at: now(), message, questionKey,
      ...(message.kind === 'approval' ? { approval: { toolName: data.toolName, reason: data.reason ?? '' } } : {}) }
    facts.set(keyOf(sessionId, message.kind), fact)
    events.set(id, { fact, status: 'waiting' })
    while (events.size > 512) {
      const old = events.keys().next().value
      const item = events.get(old)
      if (facts.get(keyOf(item.fact.sessionId, item.fact.kind))?.id === old) facts.delete(keyOf(item.fact.sessionId, item.fact.kind))
      events.delete(old)
    }
    return fact
  }
  function resolve(sessionId, kind, callId) {
    const fact = facts.get(keyOf(sessionId, kind))
    if (!fact) return undefined
    if (callId && fact.callId && String(callId) !== String(fact.callId)) return undefined
    return fact
  }
  function claim(fact) {
    const item = events.get(fact?.id)
    if (!item || item.status !== 'waiting') return false
    item.status = 'claimed'
    return true
  }
  return { present, attended, observe, resolve, claim,
    deliveredFor: sessionId => [...events.values()].filter(item => (sessionId === undefined || item.fact.sessionId === String(sessionId)) && ['claimed', 'rendered', 'queued', 'uncertain', 'accepted'].includes(item.status)).map(item => item.fact),
    waiting: fact => events.get(fact.id)?.status === 'waiting',
    pending: fact => events.get(fact.id)?.status === 'waiting' && facts.get(keyOf(fact.sessionId, fact.kind))?.id === fact.id,
    finish(fact, status) { const item = events.get(fact?.id); if (item) item.status = status },
    active: () => [...peers.values()].some(peer => now() - peer.at <= ttl),
    clear() { peers.clear(); facts.clear(); events.clear() },
  }
}

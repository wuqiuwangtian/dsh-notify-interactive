import { randomUUID } from 'node:crypto'
import { validPresentation, validAnswer, presentationKey, questionsKey } from '../interaction/schema.js'

/** A command is handed to one live page once. Lost acknowledgements never replay answers. */
export function createInteractionBroker({ coordinator, now = Date.now, ttl = 8000, commandMs = 10000, onUpdate = () => {} }) {
  const instanceId = randomUUID()
  const owners = new Map(), commands = new Map(), locked = new Map()
  const approvalCalls = new Map()
  const unnamedQuestions = new Map()
  let approvalOverflow = false
  let questionOverflow = false
  const focusSequences = new Map()
  function observe(fact) {
    if (fact?.kind === 'question' && fact.questionKey) {
      const key = JSON.stringify([fact.sessionId, fact.questionKey])
      if (!unnamedQuestions.has(key) && unnamedQuestions.size >= 1024) questionOverflow = true
      else {
        const ids = unnamedQuestions.get(key) ?? new Set()
        if (ids.size < 2) ids.add(fact.id)
        unnamedQuestions.set(key, ids)
      }
    }
    if (fact?.kind !== 'approval' || !fact.callId) return
    const key = JSON.stringify([fact.sessionId, fact.callId])
    if (!approvalCalls.has(key) && approvalCalls.size >= 1024) { approvalOverflow = true; return }
    const ids = approvalCalls.get(key) ?? new Set()
    if (ids.size < 2) ids.add(fact.id)
    approvalCalls.set(key, ids)
    // Fail closed rather than forget an ambiguous call and re-enable approval.
  }
  function resolveView(sessionId, view) {
    const fact = coordinator.resolve(sessionId, view.kind, view.callId)
    if (!fact) return undefined
    if (view.callId) return String(fact.callId) === view.callId ? fact : undefined
    const key = questionsKey(view.questions)
    if (view.kind !== 'question' || questionOverflow || !fact.questionKey || fact.questionKey !== key ||
      unnamedQuestions.get(JSON.stringify([fact.sessionId, key]))?.size !== 1) return undefined
    return fact
  }
  function current(owner) {
    const fact = resolveView(owner.sessionId, owner.view)
    if (!fact || fact.id !== owner.eventId || now() - owner.at > ttl) return false
    if (owner.view.kind === 'approval' && (approvalOverflow || approvalCalls.get(JSON.stringify([fact.sessionId, fact.callId]))?.size !== 1)) return false
    if (owner.view.kind === 'approval' && (owner.view.toolName !== fact.approval?.toolName || owner.view.reason !== fact.approval?.reason)) return false
    return true
  }
  function selected(eventId) {
    return [...owners.values()].find(owner => owner.eventId === eventId && current(owner))
  }
  function presentation(eventId) {
    const owner = selected(eventId)
    return owner ? { ...owner.view, instanceId, eventId, token: owner.token, blocked: locked.has(eventId) } : null
  }
  function complete(command, status) {
    clearTimeout(command.timer)
    command.status = status
    if (!['uncertain', 'success'].includes(status) && locked.get(command.eventId)?.id === command.id) locked.delete(command.eventId)
    command.answer = undefined
    command.resolve?.({ status })
    command.resolve = undefined
    onUpdate(command.eventId, presentation(command.eventId))
  }
  function sync(clientId, registrations) {
    if (typeof clientId !== 'string' || clientId.length > 160 || !Array.isArray(registrations) || registrations.length > 128) throw new Error('invalid-registration')
    const retained = new Set(), bindings = []
    for (const item of registrations) {
      if (typeof item.token !== 'string' || item.token.length > 160 || typeof item.sessionId !== 'string' || !validPresentation(item.view)) continue
      const fact = resolveView(item.sessionId, item.view)
      if (!fact) continue
      const key = JSON.stringify([clientId, item.token])
      const old = owners.get(key)
      if (!old && owners.size >= 512) continue
      // A page token can never migrate to another host request, even with the same callId.
      if (old && old.eventId !== fact.id) continue
      const owner = { clientId, token: item.token, sessionId: item.sessionId, eventId: fact.id, view: item.view, at: now() }
      if (!current(owner)) continue
      owners.set(key, owner); retained.add(key)
      bindings.push({ token: item.token, eventId: fact.id })
      onUpdate(fact.id, presentation(fact.id))
    }
    for (const [key, owner] of owners) if ((owner.clientId === clientId && !retained.has(key)) || !current(owner)) {
      owners.delete(key); onUpdate(owner.eventId, presentation(owner.eventId))
    }
    // No retransmission: a consumed command is not offered to this or another page again.
    const offered = []
    for (const command of commands.values()) if (command.clientId === clientId && command.status === 'waiting') {
      const owner = owners.get(JSON.stringify([clientId, command.token]))
      if (!owner || !current(owner) || presentationKey(owner.view) !== command.viewKey) { complete(command, 'unavailable'); continue }
      command.status = 'offered'
      offered.push({ id: command.id, instanceId, eventId: command.eventId, token: command.token, sessionId: owner.sessionId, action: command.action, answer: command.answer, viewKey: command.viewKey, sequence: command.sequence })
    }
    return { instanceId, bindings, commands: offered }
  }
  function execute(clientId, id, token, eventId) {
    const command = commands.get(id), owner = owners.get(JSON.stringify([clientId, token]))
    if (!command || command.clientId !== clientId || command.token !== token || command.eventId !== eventId || command.status !== 'offered' || !owner || !current(owner) || presentationKey(owner.view) !== command.viewKey) return false
    if (command.sequence !== undefined && command.sequence !== focusSequences.get(eventId)) return false
    command.status = 'executing'
    return true
  }
  function result(clientId, id, status) {
    const command = commands.get(id)
    if (!command || command.clientId !== clientId || !['offered', 'executing'].includes(command.status)) return false
    complete(command, command.status === 'executing' ? status === 'success' ? 'success' : 'uncertain' : 'unavailable')
    return true
  }
  async function submit(packet) {
    if (packet.instanceId !== instanceId || typeof packet.eventId !== 'string' || !['answer', 'focus', 'blur', 'engage', 'take-time'].includes(packet.action)) return { status: 'unavailable' }
    const owner = selected(packet.eventId)
    if (!owner || packet.token !== owner.token || (packet.action === 'answer' && locked.has(packet.eventId))) return { status: 'unavailable' }
    if (['focus', 'blur'].includes(packet.action)) {
      if (!Number.isSafeInteger(packet.sequence) || packet.sequence <= (focusSequences.get(packet.eventId) ?? -1)) return { status: 'unavailable' }
      focusSequences.set(packet.eventId, packet.sequence)
      if (focusSequences.size > 512) focusSequences.delete(focusSequences.keys().next().value)
    }
    if (packet.action === 'answer' && !validAnswer(owner.view, packet.answer)) return { status: 'invalid' }
    if (commands.size >= 256) {
      for (const [id, command] of commands) if (!command.resolve) commands.delete(id)
      if (commands.size >= 256) return { status: 'unavailable' }
    }
    const id = randomUUID()
    if (packet.action === 'answer') {
      if (locked.size >= 512) return { status: 'unavailable' }
      locked.set(packet.eventId, { id, sessionId: owner.sessionId, kind: owner.view.kind })
    }
    return new Promise(resolve => {
      const command = { id, eventId: packet.eventId, clientId: owner.clientId, token: owner.token, action: packet.action,
        answer: packet.answer, viewKey: presentationKey(owner.view), sequence: packet.sequence, status: 'waiting', resolve }
      command.timer = setTimeout(() => complete(command, command.status === 'executing' ? 'uncertain' : 'unavailable'), commandMs)
      command.timer.unref?.()
      commands.set(id, command)
    })
  }
  return { instanceId, observe, sync, execute, result, submit, presentation,
    sweep() {
      for (const [key, owner] of owners) if (!current(owner)) { owners.delete(key); onUpdate(owner.eventId, presentation(owner.eventId)) }
      for (const [eventId, lock] of locked) if (coordinator.resolve(lock.sessionId, lock.kind)?.id !== eventId) locked.delete(eventId)
    },
    dispose() { for (const c of commands.values()) if (c.resolve) complete(c, c.status === 'executing' ? 'uncertain' : 'unavailable'); owners.clear(); commands.clear(); locked.clear(); approvalCalls.clear(); unnamedQuestions.clear() } }
}

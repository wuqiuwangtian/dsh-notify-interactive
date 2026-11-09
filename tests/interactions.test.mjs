import test from 'node:test'
import assert from 'node:assert/strict'
import { createCoordinator } from '../src/host/coordinator.js'
import { createInteractionBroker } from '../src/host/interactions.js'
import { createInteractionBridge } from '../src/client/interactions.js'
import { presentationOf, validPresentation, validAnswer } from '../src/interaction/schema.js'

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function harness(options = {}) {
  const coordinator = createCoordinator(), calls = [], updates = []
  const broker = createInteractionBroker({ coordinator, onUpdate: (...args) => updates.push(args), ...options })
  function event(type, data) {
    const kind = type === 'approval/asked' ? 'approval' : type === 'tool/call' ? data.name === 'exit_plan_mode' ? 'plan-review' : 'question' : undefined
    const fact = coordinator.observe({ id: 's' }, { type, data }, kind ? { kind } : null)
    broker.observe(fact)
    return fact
  }
  async function fetch(path, init) {
    const body = JSON.parse(init.body)
    let result
    if (path.endsWith('/interactions')) result = broker.sync(body.clientId, body.registrations)
    if (path.endsWith('/interaction-execute')) {
      await options.beforeExecute?.()
      result = { allowed: body.instanceId === broker.instanceId && broker.execute(body.clientId, body.id, body.token, body.eventId) }
    }
    if (path.endsWith('/interaction-result')) result = { accepted: broker.result(body.clientId, body.id, body.status) }
    return { ok: true, json: async () => result }
  }
  function page(pending, id = 'page-a') {
    const statuses = new Map([['s', { pendingInteraction: pending }]])
    const bridge = createInteractionBridge({ clientId: id, getStatus: () => statuses, fetch, makeToken: () => `${id}-token` })
    return { bridge, statuses }
  }
  function approval(extra = {}) {
    return { kind: 'approval', key: 'local-1', sessionId: 's', callId: 'c', toolName: 'shell', reason: 'write', answerable: true,
      answer: async outcome => { calls.push(outcome) }, ...extra }
  }
  function question(kind = 'question') {
    const state = { channel: 'waterfall', closed: false, countdown: { remainingMs: 5000, running: true } }
    return { kind, key: 'q-local', callId: 'q-call',
      questions: [{ id: 'a', question: 'Choice?', options: [{ label: 'A' }, { label: 'B' }] }, { id: 'b', question: 'Multi?', multiSelect: true, options: [{ label: 'X' }, { label: 'Y' }] }],
      snapshot: () => state, state, answer: async answer => { calls.push(answer) },
      holdFocus: () => { state.countdown.running = false }, releaseFocus: () => { state.countdown.running = true }, engage: () => { state.countdown.running = false }, takeTime: () => { state.countdown = undefined } }
  }
  const packet = (fact, extra = {}) => ({ ...broker.presentation(fact.id), action: 'answer', ...extra })
  return { broker, coordinator, calls, updates, event, page, approval, question, packet }
}

test('an explicit desktop approval uses one live page, never another matching local key', async () => {
  const h = harness()
  try {
    const fact = h.event('approval/asked', { id: 'host-id', callId: 'c', toolName: 'shell', reason: 'write' })
    const a = h.page(h.approval()), b = h.page(h.approval(), 'page-b')
    await a.bridge.sync(); await b.bridge.sync()
    assert.equal(h.calls.length, 0)
    const result = h.broker.submit(h.packet(fact, { answer: 'allowed-once' }))
    await b.bridge.sync(); assert.equal(h.calls.length, 0)
    await a.bridge.sync()
    assert.deepEqual(await result, { status: 'success' })
    assert.deepEqual(h.calls, ['allowed-once'])
    assert.deepEqual(await h.broker.submit(h.packet(fact, { answer: 'rejected' })), { status: 'unavailable' })
    await a.bridge.sync(); assert.equal(h.calls.length, 1)
  } finally { h.broker.dispose() }
})

test('question batches preserve choices, multi-select, custom and explicit skip; reject malformed answers', async () => {
  const h = harness()
  try {
    const fact = h.event('tool/call', { callId: 'q-call', name: 'ask_user_question' })
    const q = h.question(), p = h.page(q); await p.bridge.sync()
    for (const answer of [
      { answers: [{ id: 'a', selected: ['A'] }] },
      { answers: [{ id: 'a', selected: ['A', 'B'] }, { id: 'b', selected: [] }] },
      { answers: [{ id: 'a', selected: ['unknown'] }, { id: 'b', selected: [] }] },
      { answers: [{ id: 'a', selected: ['A'], custom: 'mixed single' }, { id: 'b', selected: [] }] },
    ]) assert.equal((await h.broker.submit(h.packet(fact, { answer }))).status, 'invalid')
    const answer = { answers: [{ id: 'a', selected: [] }, { id: 'b', selected: ['X', 'Y'], custom: 'additional detail' }] }
    const result = h.broker.submit(h.packet(fact, { answer })); await p.bridge.sync()
    assert.equal((await result).status, 'success'); assert.deepEqual(h.calls, [answer])
  } finally { h.broker.dispose() }
})

test('Pending replacement while execute authorization is in flight cannot answer the replacement or old object', async () => {
  let replace
  const h = harness({ beforeExecute: async () => replace() })
  try {
    const fact = h.event('approval/asked', { id: 'host-id', callId: 'c', toolName: 'shell', reason: 'write' })
    const p = h.page(h.approval()); await p.bridge.sync()
    replace = () => p.statuses.set('s', { pendingInteraction: h.approval({ key: 'new-local' }) })
    const result = h.broker.submit(h.packet(fact, { answer: 'allowed-once' })); await p.bridge.sync()
    assert.equal((await result).status, 'uncertain'); assert.equal(h.calls.length, 0)
  } finally { h.broker.dispose() }
})

test('host fact invalidation between polling and execute refuses the answer', async () => {
  let invalidate
  const h = harness({ beforeExecute: async () => invalidate() })
  try {
    const fact = h.event('approval/asked', { id: 'host-id', callId: 'c', toolName: 'shell', reason: 'write' })
    const p = h.page(h.approval()); await p.bridge.sync()
    invalidate = () => h.event('approval/decided', { id: 'host-id' })
    const result = h.broker.submit(h.packet(fact, { answer: 'allowed-once' })); await p.bridge.sync()
    assert.equal((await result).status, 'unavailable'); assert.equal(h.calls.length, 0)
  } finally { h.broker.dispose() }
})

test('no callId or reused approval callId stays reminder-only rather than binding ambiguously', async () => {
  const h = harness()
  try {
    const first = h.event('approval/asked', { id: 'host-1', callId: 'c', toolName: 'shell', reason: 'write' })
    const p = h.page(h.approval()); await p.bridge.sync()
    assert.ok(h.broker.presentation(first.id))
    h.event('approval/decided', { id: 'host-1' })
    const next = h.event('approval/asked', { id: 'host-2', callId: 'c', toolName: 'shell', reason: 'write' })
    await p.bridge.sync()
    assert.equal(h.broker.presentation(next.id), null)
    assert.equal(presentationOf(h.approval({ callId: undefined })), null)
  } finally { h.broker.dispose() }
})

test('owner lease expiration and wrong instance prevent submission', async () => {
  let now = 1000
  const h = harness({ now: () => now, ttl: 100 })
  try {
    const fact = h.event('approval/asked', { id: 'host', callId: 'c', toolName: 'shell', reason: 'write' })
    const p = h.page(h.approval()); await p.bridge.sync()
    const packet = h.packet(fact, { answer: 'allowed-once' })
    assert.equal((await h.broker.submit({ ...packet, instanceId: 'other-host' })).status, 'unavailable')
    now += 101; h.broker.sweep()
    assert.equal(h.broker.presentation(fact.id), null)
    assert.equal((await h.broker.submit(packet)).status, 'unavailable')
  } finally { h.broker.dispose() }
})

test('frozen page expires a command without replay; an invoked answer failure stays uncertain and blocked', async () => {
  const h = harness({ commandMs: 30 })
  try {
    const fact = h.event('approval/asked', { id: 'host', callId: 'c', toolName: 'shell', reason: 'write' })
    const p = h.page(h.approval({ answer: async () => { h.calls.push('attempt'); throw Error('ack-lost') } })); await p.bridge.sync()
    const timed = h.broker.submit(h.packet(fact, { answer: 'allowed-once' }))
    await pause(40); assert.equal((await timed).status, 'unavailable')
    await p.bridge.sync(); assert.equal(h.calls.length, 0)
    const result = h.broker.submit(h.packet(fact, { answer: 'allowed-once' })); await p.bridge.sync()
    assert.equal((await result).status, 'uncertain')
    assert.equal((await h.broker.submit(h.packet(fact, { answer: 'allowed-once' }))).status, 'unavailable')
    assert.deepEqual(h.calls, ['attempt'])
  } finally { h.broker.dispose() }
})

test('continued question uses rpc and dismisses only after success; plan keeps exact question identity', async () => {
  const h = harness()
  try {
    const fact = h.event('tool/call', { callId: 'q-call', name: 'exit_plan_mode' })
    const q = h.question('plan-review'); q.state.channel = 'rpc'
    q.questions = [{ id: 'plan', question: 'Approve?', detail: 'Full plan', intent: { kind: 'plan-review', approve: 'Proceed' }, options: [{ label: 'Proceed' }, { label: 'Revise' }] }]
    q.dismiss = async () => h.calls.push('dismiss')
    const p = h.page(q); await p.bridge.sync()
    const answer = { answers: [{ id: 'plan', selected: ['Revise'] }] }
    const result = h.broker.submit(h.packet(fact, { answer })); await p.bridge.sync()
    assert.equal((await result).status, 'success'); assert.deepEqual(h.calls, [answer, 'dismiss'])
  } finally { h.broker.dispose() }
})

test('desktop focus pauses only on explicit focus, newer blur wins; editing and take-time use native methods', async () => {
  const h = harness()
  try {
    const fact = h.event('tool/call', { callId: 'q-call', name: 'ask_user_question' })
    const q = h.question(), p = h.page(q); await p.bridge.sync()
    assert.equal(q.state.countdown.running, true)
    const focus = h.broker.submit(h.packet(fact, { action: 'focus', sequence: 1 }))
    const blur = h.broker.submit(h.packet(fact, { action: 'blur', sequence: 2 }))
    await p.bridge.sync()
    assert.equal((await focus).status, 'unavailable'); assert.equal((await blur).status, 'success')
    assert.equal(q.state.countdown.running, true)
    const edit = h.broker.submit(h.packet(fact, { action: 'engage' })); await p.bridge.sync()
    assert.equal((await edit).status, 'success'); assert.equal(q.state.countdown.running, false)
    const time = h.broker.submit(h.packet(fact, { action: 'take-time' })); await p.bridge.sync()
    assert.equal((await time).status, 'success'); assert.equal(q.state.countdown, undefined)
  } finally { h.broker.dispose() }
})

test('read-only and closed Pending objects have no bridge; schemas reject duplicate question IDs and forged options', () => {
  const h = harness()
  try {
    assert.equal(presentationOf(h.approval({ answerable: false })), null)
    const q = h.question(); q.state.closed = true; assert.equal(presentationOf(q), null)
    q.state.closed = false; q.state.channel = 'none'; assert.equal(presentationOf(q), null)
    q.state.channel = 'rpc'; const view = presentationOf(q)
    assert.equal(validPresentation(view), true)
    assert.equal(validPresentation({ ...view, questions: [view.questions[0], view.questions[0]] }), false)
    assert.equal(validAnswer(view, { answers: [{ id: 'a', selected: ['A'] }, { id: 'wrong-id', selected: [] }] }), false)
  } finally { h.broker.dispose() }
})

test('lost acknowledgement after execute stays blocked and cannot be claimed by a replacement page', async () => {
  const h = harness({ commandMs: 25 })
  try {
    const fact = h.event('approval/asked', { id: 'host', callId: 'c', toolName: 'shell', reason: 'write' })
    const a = h.page(h.approval()); await a.bridge.sync()
    const response = h.broker.sync('page-a', [{ sessionId: 's', token: 'page-a-token', view: presentationOf(h.approval()) }])
    assert.equal(response.commands.length, 0)
    const result = h.broker.submit(h.packet(fact, { answer: 'allowed-once' }))
    const offered = h.broker.sync('page-a', [{ sessionId: 's', token: 'page-a-token', view: presentationOf(h.approval()) }]).commands[0]
    assert.equal(h.broker.execute('page-a', offered.id, offered.token, offered.eventId), true)
    await pause(35)
    assert.equal((await result).status, 'uncertain')
    const b = h.page(h.approval(), 'page-b'); await b.bridge.sync()
    assert.equal((await h.broker.submit(h.packet(fact, { answer: 'allowed-once' }))).status, 'unavailable')
    assert.equal(h.calls.length, 0)
  } finally { h.broker.dispose() }
})

test('mismatched approval metadata cannot create a desktop answer target', async () => {
  const h = harness()
  try {
    const fact = h.event('approval/asked', { id: 'host', callId: 'c', toolName: 'shell', reason: 'write' })
    const p = h.page(h.approval({ reason: 'different request' })); await p.bridge.sync()
    assert.equal(h.broker.presentation(fact.id), null)
  } finally { h.broker.dispose() }
})

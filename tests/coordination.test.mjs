import test from 'node:test'
import assert from 'node:assert/strict'
import { createCoordinator } from '../src/host/coordinator.js'
import { channelPolicy, deliverNotification } from '../src/host/delivery.js'
import { createDefaultSettings, mergeSettings } from '../src/state/settings.js'

const session = { id: 'session-1' }
const completion = turn => ({ type: 'turn/end', data: { turn, reason: { kind: 'completed' } } })
const message = { kind: 'completion', title: 'end', body: 'finished' }

test('one event has one claim across pages; two distinct turns are never cooldown-merged', () => {
  const c = createCoordinator()
  const first = c.observe(session, completion(1), message)
  assert.equal(c.claim(first), true)
  assert.equal(c.claim(first), false)
  assert.equal(c.claim(c.observe(session, completion(1), message)), false)
  const second = c.observe(session, completion(2), message)
  assert.notEqual(second.id, first.id)
  assert.equal(c.claim(second), true)
})

test('closing one page does not remove another page attention; old focus needs an event-time refresh', () => {
  let clock = 1000
  const c = createCoordinator({ now: () => clock })
  c.present({ clientId: 'a', active: true, focused: true, visible: true, sessionId: session.id })
  c.present({ clientId: 'b', active: true, focused: false, visible: true, sessionId: 'other' })
  clock += 100
  const fact = c.observe(session, completion(1), message)
  assert.equal(c.attended(session.id), true)
  assert.equal(c.attended(session.id, fact.at), false)
  c.present({ clientId: 'b', active: false })
  c.present({ clientId: 'a', active: true, focused: true, visible: true, sessionId: session.id })
  assert.equal(c.attended(session.id, fact.at), true)
  clock += 15001
  assert.equal(c.attended(session.id), false)
})

test('settled approvals and interrupted or superseded turns invalidate delayed notifications', () => {
  const c = createCoordinator()
  const approval = c.observe(session, { type: 'approval/asked', data: { id: 'ask-1', callId: 'call-1' } }, { kind: 'approval' })
  assert.equal(c.resolve(session.id, 'approval', 'other-call'), undefined)
  c.observe(session, { type: 'approval/decided', data: { id: 'ask-1' } })
  assert.equal(c.pending(approval), false)
  const turn = c.observe(session, completion(1), message)
  c.observe(session, { type: 'turn/start' })
  assert.equal(c.pending(turn), false)
  c.observe(session, completion(2), message)
  c.observe(session, { type: 'turn/end', data: { turn: 3, reason: { kind: 'aborted' } } })
  assert.equal(c.resolve(session.id, 'completion'), undefined)
})

test('global and event popup/sound gates are independent, including event presets and zero volume', () => {
  for (const popup of [true, false]) for (const sound of [true, false]) {
    const settings = mergeSettings(createDefaultSettings(), { popup: { enabled: popup }, sound: { enabled: sound }, scenarios: { completion: { preset: 'pulse' } } })
    const policy = channelPolicy(settings, 'completion')
    assert.equal(policy.popup, popup)
    assert.equal(policy.sound, sound)
    assert.equal(policy.preset, 'pulse')
    assert.equal(channelPolicy(settings, 'completion', true).sound, false)
  }
  assert.equal(channelPolicy(mergeSettings(createDefaultSettings(), { sound: { volume: 0 } }), 'approval').sound, false)
  assert.equal(channelPolicy(mergeSettings(createDefaultSettings(), { scenarios: { approval: { notify: false, preset: 'none' } } }), 'approval').popup, false)
})

test('sound-only delivery creates no popup; uncertain delivery does not ring again through fallback', async () => {
  const calls = []
  let fallbacks = 0
  const options = { companion: { deliver: async value => { calls.push(value); return { status: 'uncertain' } } }, available: true, legacy: () => { fallbacks++; return true }, payload: { body: 'done' }, policy: { popup: false, sound: true, preset: 'pulse', volume: 0.5 } }
  assert.equal((await deliverNotification(options)).delivery, 'uncertain')
  assert.equal(calls[0].popup, false)
  assert.match(calls[0].audio, /^data:audio\/wav/)
  assert.equal(fallbacks, 0)
  options.companion.deliver = async () => ({ status: 'unavailable' })
  await deliverNotification(options)
  assert.equal(fallbacks, 1)
})


test('continued questions stay current until their real reply, including long human waits', () => {
  let clock = 100
  const c = createCoordinator({ now: () => clock })
  c.observe(session, { type: 'tool/call', data: { callId: 'question-1' } }, { kind: 'question' })
  c.observe(session, { type: 'tool/result', data: { callId: 'question-1', message: { content: '{"pending":true}' } } })
  clock += 20 * 60 * 1000
  assert.ok(c.resolve(session.id, 'question', 'question-1'))
  c.observe(session, { type: 'user/message', data: { source: { kind: 'user-question-reply', callId: 'question-1' } } })
  assert.equal(c.resolve(session.id, 'question'), undefined)
})


test('a request invalidated during companion startup is not presented or sent to native fallback', async () => {
  let valid = true, fallback = false
  const result = await deliverNotification({
    available: true, policy: { popup: true, sound: true, preset: 'pulse', volume: 0.5 }, payload: {},
    isCurrent: () => valid,
    companion: { deliver: async (_payload, prepare) => { valid = false; assert.equal(prepare(), null); return { status: 'suppressed' } } },
    legacy: () => { fallback = true },
  })
  assert.equal(result.delivery, 'suppressed')
  assert.equal(fallback, false)
})

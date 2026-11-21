import test from 'node:test'
import assert from 'node:assert/strict'
import { createCoordinator } from '../src/host/coordinator.js'
import { channelPolicy } from '../src/host/delivery.js'
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


test('native tool/result uses message.toolCallId and text blocks, preserving continued questions until replied', () => {
  const c = createCoordinator()
  const session = { id: 'native' }
  const request = { type: 'tool/call', data: { callId: 'native-call', name: 'ask_user_question', arguments: '{}' } }
  const fact = c.observe(session, request, { kind: 'question' })
  c.observe(session, { type: 'tool/result', data: { message: { role: 'tool', toolCallId: 'native-call', content: [{ type: 'text', text: JSON.stringify({ pending: true, callId: 'native-call' }) }] } } }, null)
  assert.equal(c.resolve(session.id, 'question')?.id, fact.id)
  c.observe(session, { type: 'user/message', data: { source: { kind: 'user-question-reply', callId: 'native-call' } } }, null)
  assert.equal(c.resolve(session.id, 'question'), undefined)
  const next = c.observe(session, { ...request, data: { ...request.data, callId: 'native-call-2' } }, { kind: 'question' })
  assert.ok(next)
  c.observe(session, { type: 'tool/result', data: { message: { role: 'tool', toolCallId: 'native-call-2', content: [{ type: 'text', text: '{"answers":[]}' }] } } }, null)
  assert.equal(c.resolve(session.id, 'question'), undefined)
})

test('completion timing affects only visuals across focused conversations and windows', () => {
  const c = createCoordinator()
  c.present({ clientId: 'B', sessionId: 'B', focused: true, visible: true })
  c.present({ clientId: 'A', sessionId: 'A', focused: false, visible: true })
  assert.equal(c.attended(undefined), true)
  assert.equal(c.attended('A'), false)
  for (const [mode, same, other, outside] of [
    ['always', true, true, true], ['session-away', false, true, true],
    ['window-away', false, false, true], ['never', false, false, false],
  ]) {
    const s = mergeSettings(createDefaultSettings(), { popup: { completionMode: mode } })
    for (const [attended, focused, visual] of [[true, true, same], [false, true, other], [false, false, outside]]) {
      const result = channelPolicy(s, 'completion', attended, focused)
      assert.equal(result.popup, visual)
      assert.equal(result.sound, !attended)
      assert.equal(channelPolicy(s, 'approval', attended, focused).popup, !attended)
    }
  }
})

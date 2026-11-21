import test from 'node:test'
import assert from 'node:assert/strict'
import { createEngine, truncate } from '../src/engine/engine.js'
import { diffSessionStatus } from '../src/engine/diff.js'
import { gateChannels, findMainSessionId } from '../src/engine/suppression.js'
import { createDefaultSettings } from '../src/state/settings.js'

function statusOf(overrides = {}) {
  return new Map([['s1', {
    running: true,
    pendingInteraction: undefined,
    completionUnread: false,
    ...overrides,
  }]])
}

function sessionsOf({ main = true, origin, title = 'Session one' } = {}) {
  return {
    ids: ['s1'],
    byId: {
      s1: {
        id: 's1',
        displayTitle: title,
        retainedBy: { mainView: main ? 1 : 0 },
        origin,
      },
    },
  }
}

function approval(key = 'a1') {
  return {
    kind: 'approval',
    key,
    toolName: 'Bash',
    reason: 'run a command',
    answerable: true,
  }
}

test('diff seeds the first snapshot without events', () => {
  const first = diffSessionStatus(new Map(), statusOf({ pendingInteraction: approval('a1') }))
  assert.equal(first.events.length, 0)
  assert.equal(first.next.get('s1').pendingKey, 'a1')
})

test('diff emits a new interaction, clears the old key, and clears on withdrawal', () => {
  const first = diffSessionStatus(new Map(), statusOf({ pendingInteraction: approval('a1') }))
  const second = diffSessionStatus(first.next, statusOf({ pendingInteraction: approval('a2') }))
  assert.deepEqual(second.events.map((event) => event.type), ['interaction-cleared', 'interaction'])
  assert.equal(second.events[0].interactionKey, 'a1')
  assert.equal(second.events[1].interaction.key, 'a2')

  const third = diffSessionStatus(second.next, statusOf({ pendingInteraction: undefined }))
  assert.deepEqual(third.events.map((event) => event.type), ['interaction-cleared'])
  assert.equal(third.events[0].interactionKey, 'a2')
})

test('diff emits completion on the running edge and the unread fallback', () => {
  const first = diffSessionStatus(new Map(), statusOf({ running: true }))
  const second = diffSessionStatus(first.next, statusOf({ running: false }))
  assert.equal(second.events[0].type, 'completion')
  assert.equal(second.events[0].source, 'running')

  const third = diffSessionStatus(new Map(), statusOf({ running: false, completionUnread: false }))
  const fourth = diffSessionStatus(third.next, statusOf({ running: false, completionUnread: true }))
  assert.equal(fourth.events[0].type, 'completion')
  assert.equal(fourth.events[0].source, 'unread')
})

test('diff removes a session that left the list', () => {
  const first = diffSessionStatus(new Map(), statusOf())
  const second = diffSessionStatus(first.next, new Map())
  assert.deepEqual(second.events.map((event) => event.type), ['session-removed'])
})

test('gateChannels only suppresses the focused current conversation', () => {
  const settings = createDefaultSettings()
  const current = gateChannels({
    settings,
    scenarioKey: 'approval',
    sessionId: 's1',
    mainSessionId: 's1',
    visibility: 'visible',
    focused: true,
  })
  assert.equal(current.attended, true)
  assert.equal(current.sound, false)
  assert.equal(current.notify, false)

  const other = gateChannels({
    settings,
    scenarioKey: 'approval',
    sessionId: 's2',
    mainSessionId: 's1',
    visibility: 'visible',
    focused: true,
  })
  assert.equal(other.attended, false)
  assert.equal(other.sound, true)
  assert.equal(other.notify, true)

  const unfocused = gateChannels({
    settings,
    scenarioKey: 'approval',
    sessionId: 's1',
    mainSessionId: 's1',
    visibility: 'hidden',
    focused: false,
  })
  assert.equal(unfocused.attended, false)
  assert.equal(unfocused.notify, true)
})

test('findMainSessionId and truncate are stable helpers', () => {
  assert.equal(findMainSessionId(sessionsOf()), 's1')
  assert.equal(findMainSessionId(sessionsOf({ main: false })), undefined)
  assert.equal(truncate('a'.repeat(10), 5), 'aaaa…')
  assert.equal(truncate('short', 10), 'short')
})

test('Web dispatch sends each new pending request to the host and re-baselines on reset', () => {
  const received = []
  const engine = createEngine({ settingsStore: { getSnapshot: createDefaultSettings }, translate: key => key,
    getVisibility: () => 'visible', getFocused: () => false, onHostDelivery: packet => received.push(packet) })
  engine.ingest(statusOf(), sessionsOf())
  engine.ingest(statusOf({ pendingInteraction: approval() }), sessionsOf())
  engine.ingest(statusOf({ pendingInteraction: approval() }), sessionsOf())
  engine.reset()
  engine.ingest(statusOf({ pendingInteraction: approval() }), sessionsOf())
  engine.ingest(statusOf({ running: false }), sessionsOf())
  assert.deepEqual(received.map(row => row.kind), ['approval', 'completion'])
  assert.equal(received[0].sessionTitle, 'Session one')
  assert.match(received[0].body, /Bash/)
})

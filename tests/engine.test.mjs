import test from 'node:test'
import assert from 'node:assert/strict'
import { createEngine, truncate } from '../src/engine/engine.js'
import { diffSessionStatus } from '../src/engine/diff.js'
import { gateChannels, findMainSessionId } from '../src/engine/suppression.js'
import { createDefaultSettings, mergeSettings } from '../src/state/settings.js'
import { createNotificationStore } from '../src/state/notifications.js'

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

function createHarness(overrides = {}, options = {}) {
  const notificationStore = createNotificationStore()
  const soundCalls = []
  const windowsCalls = []
  let nowValue = 1_000
  const settingsStore = {
    getSnapshot: () => mergeSettings(createDefaultSettings(), overrides),
  }
  const engine = createEngine({
    settingsStore,
    notificationStore,
    soundPlayer: { play: (preset, volume) => soundCalls.push({ preset, volume }) },
    translate: (key) => key,
    resolveText: (value) => value?.en ?? '',
    getVisibility: () => options.visibility ?? 'hidden',
    getFocused: () => options.focused ?? false,
    isPopupOpen: () => options.popupOpen ?? false,
    onWindowsFallback: (payload) => windowsCalls.push(payload),
    now: () => nowValue,
  })
  return {
    engine,
    notificationStore,
    soundCalls,
    windowsCalls,
    advance(ms) {
      nowValue += ms
    },
    settingsStore,
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

test('engine seeds and uses the Windows fallback when the popup is closed', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
  assert.equal(harness.windowsCalls.length, 0)

  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.windowsCalls.length, 1)
  assert.equal(harness.windowsCalls[0].kind, 'approval')
})

test('engine adds a popup card when the popup is open', () => {
  const harness = createHarness({}, { popupOpen: true })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 1)
  assert.equal(harness.notificationStore.getSnapshot()[0].id, 'interaction:s1:a2')
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.windowsCalls.length, 0)

  harness.engine.ingest(statusOf({ pendingInteraction: undefined }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
})

test('engine stays completely silent while focused on the current conversation', () => {
  const harness = createHarness({}, { focused: true, visibility: 'visible' })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
  assert.equal(harness.windowsCalls.length, 0)
})

test('engine notifies another conversation while the page is focused elsewhere', () => {
  const harness = createHarness({}, { focused: true, visibility: 'visible' })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf({ main: false }))
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf({ main: false }))
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.windowsCalls.length, 1)
})

test('engine ignores subagent sessions', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf({ origin: 'subagent' }))
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf({ origin: 'subagent' }))
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.windowsCalls.length, 0)
})

test('completion uses the popup or the Windows fallback and de-duplicates signals', () => {
  const closed = createHarness()
  closed.engine.ingest(statusOf({ running: true }), sessionsOf())
  closed.engine.ingest(statusOf({ running: false }), sessionsOf())
  assert.equal(closed.notificationStore.count(), 0)
  assert.equal(closed.windowsCalls.length, 1)
  assert.equal(closed.windowsCalls[0].kind, 'completion')
  assert.equal(closed.soundCalls.length, 1)

  const open = createHarness({}, { popupOpen: true })
  open.engine.ingest(statusOf({ running: true }), sessionsOf())
  open.engine.ingest(statusOf({ running: false }), sessionsOf())
  assert.equal(open.notificationStore.count(), 1)
  assert.equal(open.notificationStore.getSnapshot()[0].kind, 'completion')
  assert.equal(open.windowsCalls.length, 0)
  assert.equal(open.soundCalls.length, 1)
})

test('engine clears cards when notifications are disabled', () => {
  const harness = createHarness({ enabled: false }, { popupOpen: true })
  harness.notificationStore.upsert({ id: 'existing', kind: 'completion', sessionId: 's1' })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
  assert.equal(harness.windowsCalls.length, 0)
})

test('engine reset re-baselines without replaying the same pending request', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  harness.engine.reset()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  assert.equal(harness.windowsCalls.length, 0)
  assert.equal(harness.soundCalls.length, 0)
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

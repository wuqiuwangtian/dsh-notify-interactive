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
  const systemCalls = []
  const activated = []
  let nowValue = 1_000
  const settingsStore = {
    getSnapshot: () => mergeSettings(createDefaultSettings(), overrides),
  }
  const engine = createEngine({
    settingsStore,
    notificationStore,
    soundPlayer: { play: (preset, volume) => soundCalls.push({ preset, volume }) },
    systemNotifier: { show: (payload) => systemCalls.push(payload) },
    translate: (key) => key,
    resolveText: (value) => value?.en ?? '',
    getVisibility: () => options.visibility ?? 'hidden',
    getFocused: () => options.focused ?? false,
    isPopupOpen: () => options.popupOpen ?? false,
    onActivate: (sessionId) => activated.push(sessionId),
    now: () => nowValue,
  })
  return {
    engine,
    notificationStore,
    soundCalls,
    systemCalls,
    activated,
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

test('engine seeds the first snapshot and notifies on the next interaction', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
  assert.equal(harness.systemCalls.length, 0)

  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 1)
  assert.equal(harness.notificationStore.getSnapshot()[0].kind, 'approval')
  assert.equal(harness.notificationStore.getSnapshot()[0].id, 'interaction:s1:a2')
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.systemCalls.length, 1)
  assert.equal(harness.systemCalls[0].kind, 'approval')

  harness.engine.ingest(statusOf({ pendingInteraction: undefined }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
})

test('engine suppresses the current focused session', () => {
  const harness = createHarness({}, { focused: true, visibility: 'visible' })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
  assert.equal(harness.systemCalls.length, 0)
})

test('engine ignores subagent sessions by default', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf({ origin: 'subagent' }))
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf({ origin: 'subagent' }))
  assert.equal(harness.notificationStore.count(), 0)
})

test('engine includes subagents when the preference is enabled', () => {
  const harness = createHarness({ behavior: { includeSubagents: true } })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf({ origin: 'subagent' }))
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a2') }), sessionsOf({ origin: 'subagent' }))
  assert.equal(harness.notificationStore.count(), 1)
})

test('engine keeps the in-page card but skips the Windows toast while the page is active', () => {
  const harness = createHarness({}, { focused: true, visibility: 'visible' })
  harness.engine.ingest(statusOf({ running: true }), sessionsOf({ main: false }))
  harness.engine.ingest(statusOf({ running: false }), sessionsOf({ main: false }))
  assert.equal(harness.notificationStore.count(), 1)
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.systemCalls.length, 0)
})

test('engine skips the Windows toast when the interactive popup owns the surface', () => {
  const harness = createHarness({}, { popupOpen: true })
  harness.engine.ingest(statusOf({ running: true }), sessionsOf())
  harness.engine.ingest(statusOf({ running: false }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 1)
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.systemCalls.length, 0)
})

test('engine creates a completion card and de-duplicates the two signals', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ running: true }), sessionsOf())
  harness.engine.ingest(statusOf({ running: false }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 1)
  assert.equal(harness.notificationStore.getSnapshot()[0].kind, 'completion')
  assert.equal(harness.soundCalls.length, 1)
  assert.equal(harness.systemCalls.length, 1)

  // A second signal inside the cooldown must not add another card.
  harness.engine.ingest(statusOf({ running: false, completionUnread: true }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 1)
  assert.equal(harness.soundCalls.length, 1)
})

test('engine clears cards when notifications are disabled', () => {
  const harness = createHarness({ enabled: false })
  harness.notificationStore.upsert({ id: 'existing', kind: 'completion', sessionId: 's1' })
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
})

test('engine reset re-baselines without replaying the same pending request', () => {
  const harness = createHarness()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  harness.engine.reset()
  harness.engine.ingest(statusOf({ pendingInteraction: approval('a1') }), sessionsOf())
  assert.equal(harness.notificationStore.count(), 0)
  assert.equal(harness.soundCalls.length, 0)
})

test('gateChannels makes the in-page card primary while the page is active', () => {
  const settings = createDefaultSettings()
  const gate = gateChannels({
    settings,
    scenarioKey: 'completion',
    sessionId: 's1',
    mainSessionId: 's2',
    visibility: 'visible',
    focused: true,
  })
  assert.equal(gate.attended, false)
  assert.equal(gate.pageActive, true)
  assert.equal(gate.sound, true)
  assert.equal(gate.popup, true)
  assert.equal(gate.system, false)
})

test('gateChannels enables the Windows toast while the page is inactive', () => {
  const settings = createDefaultSettings()
  const gate = gateChannels({
    settings,
    scenarioKey: 'completion',
    sessionId: 's1',
    mainSessionId: 's2',
    visibility: 'hidden',
    focused: false,
  })
  assert.equal(gate.pageActive, false)
  assert.equal(gate.system, true)
})

test('gateChannels suppresses everything for the current focused session', () => {
  const settings = createDefaultSettings()
  const gate = gateChannels({
    settings,
    scenarioKey: 'approval',
    sessionId: 's1',
    mainSessionId: 's1',
    visibility: 'visible',
    focused: true,
  })
  assert.equal(gate.attended, true)
  assert.equal(gate.sound, false)
  assert.equal(gate.popup, false)
  assert.equal(gate.system, false)
})

test('gateChannels disables channels independently', () => {
  const settings = mergeSettings(createDefaultSettings(), {
    sound: { enabled: false },
    scenarios: { approval: { system: false } },
  })
  const gate = gateChannels({
    settings,
    scenarioKey: 'approval',
    sessionId: 's1',
    mainSessionId: 's2',
    visibility: 'hidden',
    focused: false,
  })
  assert.equal(gate.sound, false)
  assert.equal(gate.popup, true)
  assert.equal(gate.system, false)
})

test('findMainSessionId and truncate are stable helpers', () => {
  assert.equal(findMainSessionId(sessionsOf()), 's1')
  assert.equal(findMainSessionId(sessionsOf({ main: false })), undefined)
  assert.equal(truncate('a'.repeat(10), 5), 'aaaa…')
  assert.equal(truncate('short', 10), 'short')
})

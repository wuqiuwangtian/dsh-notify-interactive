import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SETTINGS_KEY,
  createDefaultSettings,
  createSettingsStore,
  mergeSettings,
  normalizeSettings,
} from '../src/state/settings.js'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => Object.fromEntries(map),
  }
}

test('defaults cover sound and every scenario', () => {
  const defaults = createDefaultSettings()
  assert.equal(defaults.enabled, true)
  assert.equal(defaults.sound.enabled, true)
  assert.equal(defaults.sound.preset, 'chime')
  for (const key of ['approval', 'question', 'planReview', 'completion']) {
    assert.deepEqual(defaults.scenarios[key], { sound: true, notify: true })
  }
  assert.equal('popup' in defaults, false)
  assert.equal('system' in defaults, false)
})

test('normalization drops unknown keys and repairs invalid values', () => {
  const settings = normalizeSettings({
    unknown: true,
    enabled: 'yes',
    sound: { enabled: 'no', preset: 'nope', volume: 9 },
    popup: { enabled: false },
    system: { enabled: false },
    behavior: { maxVisibleCards: 99 },
    scenarios: { approval: { sound: false } },
  })
  assert.equal(settings.enabled, true)
  assert.equal(settings.sound.enabled, true)
  assert.equal(settings.sound.preset, 'chime')
  assert.equal(settings.sound.volume, 1)
  assert.equal('popup' in settings, false)
  assert.equal('system' in settings, false)
  assert.equal('unknown' in settings, false)
  assert.deepEqual(settings.scenarios.approval, { sound: false, notify: true })
})

test('partial merge keeps unrelated fields and merges one scenario', () => {
  const current = createDefaultSettings()
  const next = mergeSettings(current, {
    sound: { enabled: false },
    scenarios: { approval: { notify: false } },
  })
  assert.equal(next.sound.enabled, false)
  assert.equal(next.sound.preset, 'chime')
  assert.deepEqual(next.scenarios.approval, { sound: true, notify: false })
  assert.deepEqual(next.scenarios.question, { sound: true, notify: true })
})

test('store persists updates and reloads them', () => {
  const storage = memoryStorage()
  const store = createSettingsStore(storage)
  assert.equal(store.getSnapshot().sound.preset, 'chime')
  store.update({ sound: { preset: 'pulse', volume: 0.4 } })
  store.update({ scenarios: { completion: { notify: false } } })
  assert.ok(storage.dump()[SETTINGS_KEY])
  const reloaded = createSettingsStore(storage)
  assert.equal(reloaded.getSnapshot().sound.preset, 'pulse')
  assert.equal(reloaded.getSnapshot().sound.volume, 0.4)
  assert.deepEqual(reloaded.getSnapshot().scenarios.completion, { sound: true, notify: false })
  assert.equal(reloaded.getStatus().storageError, null)
})

test('corrupt stored JSON falls back to defaults and reports a read error', () => {
  const storage = memoryStorage({ [SETTINGS_KEY]: '{not json' })
  const store = createSettingsStore(storage)
  assert.equal(store.getSnapshot().sound.preset, 'chime')
  assert.equal(store.getStatus().storageError, 'read')
})

test('write failures degrade to memory-only settings', () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota')
    },
  }
  const store = createSettingsStore(storage)
  store.update({ enabled: false })
  assert.equal(store.getSnapshot().enabled, false)
  assert.equal(store.getStatus().storageError, 'write')
})

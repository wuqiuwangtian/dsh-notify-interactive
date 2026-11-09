import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createPreferences } from '../src/host/preferences.js'
import { createPreferencesSync } from '../src/client/preferences.js'
import { createSettingsStore } from '../src/state/settings.js'

function memoryStore() { return createSettingsStore({ getItem: () => null, setItem: () => {} }) }
function transport(host) {
  return async (_path, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null
    const value = body ? await host.update(body.revision, body.patch, body.initial) : await host.snapshot()
    return { ok: !value.conflict, status: value.conflict ? 409 : 200, json: async () => value }
  }
}

test('preferences migrate once, persist across host restart and reject stale full overwrites', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-preferences-'))
  try {
    const file = join(dir, 'settings.json')
    const host = createPreferences(file)
    assert.equal((await host.snapshot()).initialized, false)
    const migrated = await host.update(0, undefined, { version: 2, enabled: false, sound: { volume: 0.2 } })
    assert.equal(migrated.settings.enabled, false)
    assert.equal(migrated.settings.version, 3)
    assert.equal(migrated.settings.popup.enabled, true)
    const conflict = await host.update(0, { enabled: true })
    assert.equal(conflict.conflict, true)
    const restarted = await createPreferences(file).snapshot()
    assert.equal(restarted.settings.enabled, false)
    assert.equal(restarted.settings.sound.volume, 0.2)
    assert.equal(restarted.revision, 1)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('simultaneous revisions serialize and a malformed store is not silently overwritten', async () => {
  const host = createPreferences()
  const results = await Promise.all([host.update(0, { sound: { enabled: false } }), host.update(0, { popup: { enabled: false } })])
  assert.equal(results.filter(value => value.conflict).length, 1)
  const dir = await mkdtemp(join(tmpdir(), 'dsh-preferences-'))
  try {
    const file = join(dir, 'bad.json')
    await writeFile(file, 'broken-json')
    const broken = createPreferences(file)
    await assert.rejects(broken.update(0, { enabled: true }), /preferences-unreadable/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('two clients replay only changed fields after revision conflicts', async () => {
  const host = createPreferences()
  const a = memoryStore(), b = memoryStore()
  const syncA = createPreferencesSync(a, { fetch: transport(host) })
  const syncB = createPreferencesSync(b, { fetch: transport(host) })
  try {
    await Promise.all([syncA.synchronize(), syncB.synchronize()])
    a.update({ sound: { enabled: false } })
    b.update({ popup: { enabled: false } })
    // Subscription starts synchronizing; wait until it settles before forcing another pull.
    await new Promise(resolve => setTimeout(resolve, 10))
    await Promise.all([syncA.synchronize(), syncB.synchronize()])
    const saved = await host.snapshot()
    assert.equal(saved.settings.sound.enabled, false)
    assert.equal(saved.settings.popup.enabled, false)
    assert.equal(a.getSnapshot().popup.enabled, false)
    assert.equal(b.getSnapshot().sound.enabled, false)
  } finally { syncA.stop(); syncB.stop() }
})

test('offline edits remain queued and become effective after reconnect', async () => {
  const host = createPreferences()
  let offline = true
  const local = memoryStore()
  const sync = createPreferencesSync(local, { fetch: (...args) => { if (offline) return Promise.reject(Error('offline')); return transport(host)(...args) } })
  try {
    local.update({ scenarios: { question: { preset: 'alert', notify: false } } })
    await new Promise(resolve => setTimeout(resolve, 5))
    assert.equal(sync.getSnapshot(), 'offline')
    offline = false
    await sync.synchronize()
    const remote = await host.snapshot()
    assert.equal(remote.settings.scenarios.question.notify, false)
    assert.equal(remote.settings.scenarios.question.preset, 'alert')
    assert.equal(sync.getSnapshot(), 'synced')
  } finally { sync.stop() }
})

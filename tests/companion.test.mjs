import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createCompanion } from '../src/host/companion.js'
import { validateDelivery, createInteractionState } from '../companion/protocol.cjs'

function fixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-notify-test-'))
  const children = []
  const commands = []
  function emit(directory, event) {
    const temporary = join(directory, `event-${randomUUID()}.tmp`)
    writeFileSync(temporary, JSON.stringify(event))
    renameSync(temporary, temporary.replace('.tmp', '.json'))
  }
  const companion = createCompanion({
    launch: () => ({ executable: 'mock', args: [], mailboxRoot: root }),
    startupMs: 500, deliveryMs: 50, pollMs: 2,
    spawn: (_executable, args) => {
      const directory = args.at(-1).split('=').slice(1).join('=')
      const child = new EventEmitter()
      children.push(child)
      const timer = setInterval(() => {
        try {
          for (const name of readdirSync(directory).filter(name => name.startsWith('command-') && name.endsWith('.json'))) {
            const file = join(directory, name)
            const value = JSON.parse(readFileSync(file, 'utf8'))
            unlinkSync(file)
            if (value.type === 'shutdown') { child.kill(); return }
            commands.push(value)
            if (options.respond !== false) emit(directory, { type: 'rendered', id: value.id, visible: value.popup, focused: false })
          }
        } catch { clearInterval(timer) }
      }, 2)
      child.kill = () => { clearInterval(timer); child.emit('exit', 0) }
      emit(directory, { type: 'ready', protocol: 1 })
      return child
    }, ...options,
  })
  return { companion, children, commands, cleanup: () => { companion.dispose(); for (const child of children) child.kill(); rmSync(root, { recursive: true, force: true }) } }
}

test('delivery waits for the desktop acknowledgment and reuses the same process', async () => {
  const f = fixture()
  try {
    assert.deepEqual(await f.companion.deliver({ popup: true }), { status: 'rendered', visible: true, focused: false })
    assert.deepEqual(await f.companion.deliver({ popup: false }), { status: 'rendered', visible: false, focused: false })
    assert.equal(f.children.length, 1)
    assert.notEqual(f.commands[0].id, f.commands[1].id)
  } finally { f.cleanup() }
})

test('missing installation is unavailable rather than reported as shown', async () => {
  const f = fixture({ launch: () => { throw new Error('companion-not-installed') } })
  try { assert.deepEqual(await f.companion.deliver({}), { status: 'unavailable', reason: 'companion-not-installed' }) }
  finally { f.cleanup() }
})

test('lost renderer acknowledgment is uncertain rather than safe to duplicate', async () => {
  const f = fixture({ respond: false })
  try { assert.equal((await f.companion.deliver({})).status, 'uncertain') }
  finally { f.cleanup() }
})

test('a process exit permits the next event to start a fresh process', async () => {
  const f = fixture()
  try {
    await f.companion.deliver({})
    f.children[0].kill()
    assert.equal((await f.companion.deliver({})).status, 'rendered')
    assert.equal(f.children.length, 2)
    // A repeated late exit from the old child cannot terminate the new connection.
    f.children[0].kill()
    assert.equal((await f.companion.deliver({})).status, 'rendered')
    assert.equal(f.children.length, 2)
  } finally { f.cleanup() }
})

test('disposal prevents startup', async () => {
  const f = fixture()
  try {
    f.companion.dispose()
    assert.equal((await f.companion.deliver({})).status, 'unavailable')
    assert.equal(f.children.length, 0)
  } finally { f.cleanup() }
})

test('desktop protocol rejects active content, privileged URLs and invalid audio', () => {
  const valid = { type: 'deliver', id: 'test', title: 'title', body: 'body', openLabel: 'DSH', url: 'http://localhost:3000/?dsh-notify-session=s1', volume: 0.7, audio: '', theme: { '--dsw-alias-bg-base': '#fff' } }
  assert.equal(validateDelivery(valid), true)
  for (const patch of [
    { url: 'file:///c:/Windows' }, { url: 'javascript:alert(1)' },
    { url: 'https://user:password@example.com/' }, { audio: 'https://example.com/audio' },
    { volume: NaN }, { volume: -1 }, { theme: { background: 'red' } },
    { theme: { '--ds-font-family': 'url(https://example.com)' } }, { body: 'x'.repeat(2001) },
  ]) assert.equal(validateDelivery({ ...valid, ...patch }), false)
})

const { getCompanionStatus } = await import('../src/host/companion.js')
test('out-of-order mailbox interaction updates cannot revive disconnected controls, even before delivery', () => {
  const state = createInteractionState()
  const live = { kind: 'question' }
  assert.equal(state.update({ eventId: 'q', interactionRevision: 2, interaction: null }), true)
  assert.equal(state.update({ eventId: 'q', interactionRevision: 1, interaction: live }), false)
  assert.equal(state.decorate({ eventId: 'q', interactionRevision: 1, interaction: live }).interaction, null)
  assert.equal(state.decorate({ eventId: 'q', interactionRevision: 3, interaction: live }).interaction, live)
  assert.equal(state.update({ eventId: 'q', interactionRevision: 2, interaction: null }), false)
  const bounded = createInteractionState(1)
  bounded.update({ eventId: 'q', interactionRevision: 5, interaction: live })
  bounded.update({ eventId: 'other', interactionRevision: 6, interaction: live })
  assert.equal(bounded.update({ eventId: 'q', interactionRevision: 4, interaction: null }, 5), false, 'active/queued versions survive history eviction')
})
test('an installed companion is automatic without a startup flag; explicit disable wins', () => {
  const installed = () => ({ executable: 'installed' })
  assert.deepEqual(getCompanionStatus({}, installed), { mode: 'automatic', available: true, enabled: true, scope: 'reminders' })
  assert.equal(getCompanionStatus({ DSH_NOTIFY_COMPANION: '0' }, installed).enabled, false)
  const missing = () => { throw new Error('missing') }
  assert.equal(getCompanionStatus({}, missing).enabled, false)
  assert.equal(getCompanionStatus({ DSH_NOTIFY_COMPANION: '1' }, missing).enabled, true)
})

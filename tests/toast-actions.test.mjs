import test from 'node:test'
import assert from 'node:assert/strict'
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as wait } from 'node:timers/promises'
import { createToastActions, quickActions } from '../src/host/toast-actions.js'

const approval = { kind: 'approval', instanceId: 'i', token: 'owner', eventId: 'e', toolName: 'sample', reason: 'Read example' }
const q = { id: 'a', question: 'Choose a platform', options: [{ label: 'Windows' }, { label: 'Linux' }] }
const question = { ...approval, kind: 'question', questions: [q] }

test('native questions offer explicit choice, custom text and skip only for an entire simple request', () => {
  assert.equal(quickActions({ ...approval, reason: 'a'.repeat(240) }), null)
  const form = quickActions(question)
  assert.deepEqual(form.buttons[0].answer, { answers: [{ id: 'a', selected: ['Windows'] }] })
  assert.equal(form.buttons[2].questionId, 'a')
  assert.deepEqual(form.buttons.at(-1).answer, { answers: [{ id: 'a', selected: [] }] })
  for (const view of [null, { ...approval, blocked: true }, { ...question, kind: 'plan-review' },
    { ...question, questions: [q, q] }, ...[{ detail: 'Read first' }, { multiSelect: true },
      { options: [{ label: 'Windows', description: 'Important' }] }].map(change => ({ ...question, questions: [{ ...q, ...change }] }))]) {
    assert.equal(quickActions(view), null)
  }
})

async function fixture(t, initial) {
  const base = await mkdtemp(join(tmpdir(), 'toast-actions-'))
  let view = initial, live = true, failures = 0
  const packets = []
  const actions = createToastActions({ register: async () => ({ base, stop() {}, closed: new Promise(() => {}) }), pollMs: 5, submit: async packet => {
    packets.push(packet)
    return { status: 'success' }
  } })
  await actions.prepare()
  t.after(async () => { await actions.dispose(); await rm(base, { recursive: true, force: true }) })
  const form = actions.bind('e', () => view, () => live, () => { failures++ })
  return { actions, form, packets, failures: () => failures, setView: next => { view = next }, retire: () => { live = false },
    async click(index, text = '') {
      const file = join(base, form.buttons[index].argument + '.reply')
      await writeFile(file, text)
      const deadline = Date.now() + 3000
      while (await access(file).then(() => true, () => false)) {
        assert.ok(Date.now() < deadline, 'host did not consume the activation')
        await wait(5)
      }
    } }
}

test('two Windows buttons race and a replay leaves exactly one bound submission', async t => {
  const f = await fixture(t, approval)
  await Promise.all([f.click(0), f.click(1)])
  await f.click(0)
  assert.equal(f.packets.length, 1)
  assert.equal(f.packets[0].token, 'owner')
  assert.ok(['allowed-once', 'rejected'].includes(f.packets[0].answer))
})

test('custom text keeps Unicode and submitting blank text never skips the question', async t => {
  const f = await fixture(t, question)
  await f.click(2, '  自定义 🔔  ')
  assert.deepEqual(f.packets[0].answer, { answers: [{ id: 'a', selected: [], custom: '自定义 🔔' }] })
  const empty = await fixture(t, question)
  await empty.click(2, '  ')
  assert.deepEqual(empty.packets, [])
  assert.equal(empty.failures(), 1)
})

test('retirement, owner replacement, changed contents and disconnection invalidate stored button references', async t => {
  for (const invalidate of [
    f => f.actions.revoke('e'), f => f.setView({ ...approval, token: 'other' }),
    f => f.setView({ ...approval, reason: 'changed' }), f => f.setView(null), f => f.retire(),
  ]) {
    const f = await fixture(t, approval)
    invalidate(f)
    await f.click(0)
    assert.deepEqual(f.packets, [])
  }
})

test('a stopped activator withdraws bound buttons and the next helper cannot replay them', async t => {
  const base = await mkdtemp(join(tmpdir(), 'toast-closed-'))
  let close
  const withdrawn = [], submissions = []
  const actions = createToastActions({
    register: async () => ({ base, stop() {}, closed: new Promise(resolve => { close = resolve }) }),
    submit: async packet => { submissions.push(packet); return { status: 'success' } },
    withdraw: id => withdrawn.push(id),
  })
  t.after(async () => { await actions.dispose(); await rm(base, { recursive: true, force: true }) })
  await actions.prepare()
  const first = actions.bind('e', () => approval, () => true, () => {})
  close()
  await Promise.resolve()
  assert.deepEqual(withdrawn, ['e'])
  assert.equal(actions.current('e', approval), false)
  assert.equal(actions.bind('e', () => approval, () => true, () => {}), null)
  await actions.prepare()
  const next = actions.bind('e', () => approval, () => true, () => {})
  assert.notEqual(first.buttons[0].argument, next.buttons[0].argument)
  assert.deepEqual(submissions, [])
})

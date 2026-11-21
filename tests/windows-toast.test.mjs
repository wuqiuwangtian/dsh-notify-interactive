import test from 'node:test'
import assert from 'node:assert/strict'
import { completionToast, createToastDelivery } from '../scripts/windows/completion-toast.mjs'

const origin = 'http://127.0.0.1:3080'
const fact = { id: 'turn-1', kind: 'completion', sessionId: 'A & B' }
const payload = { sessionTitle: '会话 A', body: '本轮结束', url: 'http://other.invalid/?token=private' }

test('native history activation uses only the configured origin and exact target session', () => {
  const toast = completionToast(fact, origin, 'profile-one', payload)
  const target = new URL(toast.url)
  assert.equal(target.origin, origin)
  assert.deepEqual([...target.searchParams], [['dsh-notify-session', 'A & B']])
  assert.equal(toast.title, payload.sessionTitle)
  assert.equal(toast.body, payload.body)
  for (const invalid of ['file:///tmp', origin + '/?token=test', 'http://user@localhost']) {
    assert.throws(() => completionToast(fact, invalid, 'profile-one', payload))
  }
  assert.notEqual(completionToast({ ...fact, id: 'turn-2' }, origin, 'profile-one', payload).tag, toast.tag)
  assert.notEqual(completionToast(fact, origin, 'profile-two', payload).group, toast.group)
})

test('completion preview suppresses stale or disabled notifications and skips interaction events', async () => {
  const deliver = createToastDelivery(origin, 'profile-one')
  const input = { fact, payload, getPolicy: () => ({ popup: true }), isCurrent: () => false }
  assert.equal((await deliver(input)).delivery, 'suppressed')
  assert.equal((await deliver({ ...input, isCurrent: () => true, getPolicy: () => ({ popup: false }) })).delivery, 'suppressed')
  assert.equal((await deliver({ ...input, fact: { kind: 'approval' } })).delivery, 'unsupported-event')
})

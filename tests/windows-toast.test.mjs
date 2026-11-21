import test from 'node:test'
import assert from 'node:assert/strict'
import { nativeToast, createToastTransport } from '../src/host/windows-toast.js'

const origin = 'http://127.0.0.1:3080'
const fact = { id: 'turn-1', kind: 'completion', sessionId: 'A & B' }
const payload = { sessionTitle: '会话 A', body: '本轮结束', url: 'http://other.invalid/?token=private' }

test('native history activation uses only the configured origin and exact target session', () => {
  const toast = nativeToast(fact, origin, 'profile-one', payload)
  const target = new URL(toast.url)
  assert.equal(target.origin, origin)
  assert.deepEqual([...target.searchParams], [['dsh-notify-session', 'A & B'], ['dsh-notify-profile', toast.group]])
  assert.equal(toast.title, payload.sessionTitle)
  assert.equal(toast.body, payload.body)
  for (const invalid of ['file:///tmp', origin + '/?token=test', 'http://user@localhost']) {
    assert.throws(() => nativeToast(fact, invalid, 'profile-one', payload))
  }
  assert.notEqual(nativeToast({ ...fact, id: 'turn-2' }, origin, 'profile-one', payload).tag, toast.tag)
  assert.notEqual(nativeToast(fact, origin, 'profile-two', payload).group, toast.group)
})

test('native transport preserves finished turns and retires invalidated requests even during Show', async () => {
  const calls = []
  let live = true
  const transport = createToastTransport(origin, 'test', async packet => {
    calls.push(packet)
    if (packet.popup) live = false
    return 'accepted'
  })
  const input = { fact, payload, getPolicy: () => ({ popup: true, sound: false }), isCurrent: () => live }
  await transport.deliver(input)
  transport.retire(fact)
  assert.equal(calls.length, 2)
  assert.equal((await transport.deliver(input)).delivery, 'suppressed')
  live = true
  await transport.deliver({ ...input, fact: { ...fact, kind: 'question' } })
  assert.equal(calls[3].removeTag, calls[2].tag)
  assert.equal(calls[3].group, calls[2].group)
  assert.notEqual(calls[2].group, calls[1].group)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PRESENCE_TTL_MS,
  messageForEvent,
  reasonLabel,
  sessionLabel,
  shouldAutoNotify,
  truncate,
} from '../src/host/logic.js'

function session(overrides = {}) {
  return {
    id: 'session-1234567890',
    header: { cwd: '/home/user/project', ...overrides.header },
    ...overrides,
  }
}

test('host auto-notifies when no web presence is active', () => {
  const now = 10_000
  assert.equal(shouldAutoNotify(null, now), true)
  assert.equal(shouldAutoNotify({ at: now - 1000, active: true }, now), false)
  assert.equal(shouldAutoNotify({ at: now - PRESENCE_TTL_MS - 1, active: true }, now), true)
  assert.equal(shouldAutoNotify({ at: now - 1000, active: false }, now), true)
  assert.equal(shouldAutoNotify({ at: now - 1000 }, now), true)
})

test('session labels prefer the cwd basename and fall back to the id', () => {
  assert.equal(sessionLabel(session()), 'project')
  assert.equal(sessionLabel({ id: 'abcdefghijklmnop', header: {} }), 'abcdefgh')
  assert.equal(sessionLabel({ id: 'short', header: {} }), 'short')
})

test('approval, question, plan review, and completion are formatted; subagents and aborts are skipped', () => {
  const approval = messageForEvent(session(), {
    type: 'approval/asked',
    data: { toolName: 'Bash', reason: 'needs escalation' },
  })
  assert.equal(approval.kind, 'approval')
  assert.match(approval.body, /project/)
  assert.match(approval.body, /Bash/)
  assert.match(approval.body, /needs escalation/)

  const question = messageForEvent(session(), {
    type: 'tool/call',
    data: {
      name: 'ask_user_question',
      arguments: JSON.stringify({ questions: [{ question: 'Which channel?' }] }),
    },
  })
  assert.equal(question.kind, 'question')
  assert.match(question.body, /Which channel\?/)

  const plan = messageForEvent(session(), {
    type: 'tool/call',
    data: { name: 'exit_plan_mode', arguments: '{}' },
  })
  assert.equal(plan.kind, 'plan-review')

  const completion = messageForEvent(session(), {
    type: 'turn/end',
    data: { turn: 3, reason: { kind: 'completed' } },
  })
  assert.equal(completion.kind, 'completion')
  assert.match(completion.body, /完成/)

  assert.equal(messageForEvent(session({ header: { origin: 'subagent' } }), {
    type: 'turn/end',
    data: { reason: { kind: 'completed' } },
  }), null)
  assert.equal(messageForEvent(session(), {
    type: 'turn/end',
    data: { reason: { kind: 'aborted' } },
  }), null)
  assert.equal(messageForEvent(session(), { type: 'tool/call', data: { name: 'bash' } }), null)
})

test('reason labels and truncation are stable', () => {
  assert.equal(reasonLabel('completed'), '完成')
  assert.equal(reasonLabel('error'), '出错')
  assert.equal(reasonLabel(undefined), '结束')
  assert.equal(truncate('a'.repeat(10), 5), 'aaaa…')
})

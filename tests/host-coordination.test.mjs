import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { applyHost } from '../src/host/index.js'

function harness(rejection, deliveryDelayMs = 10000, principal = 'owner') {
  const routes = new Map(), events = new Map(), cleanups = [], effects = [], withdrawn = [], silenced = []
  const effect = callback => { const cleanup = callback(); if (typeof cleanup === 'function') cleanups.push(cleanup) }
  const ctx = {
    get: key => key === 'connection' ? { requestRejection: () => rejection, admit: () => ({ peer: { principal: { kind: principal } } }) } : undefined,
    inject: (_dependencies, callback) => callback({ webServer: { register: route => { routes.set(route.path, route); return () => {} } }, effect }),
    on: (type, callback) => events.set(type, callback), effect,
  }
  applyHost(ctx, {
    companion: { deliver: async payload => { effects.push(payload); return { status: 'rendered' } }, dispose: () => {}, withdraw: id => withdrawn.push(id), silence: id => silenced.push(id) },
    legacy: (...args) => { effects.push(args); return true }, deliveryDelayMs, available: true,
  })
  async function request(path, method = 'GET', body) {
    const req = new EventEmitter(); req.method = method
    let status, value
    const task = routes.get(`/dsh-notify-interactive/${path}`).handler(req, {
      writeHead: code => { status = code }, setHeader: () => {}, end: data => { value = data ? JSON.parse(data) : null },
    })
    if (body) req.emit('data', Buffer.from(JSON.stringify(body)))
    req.emit('end')
    await task
    return { status, value }
  }
  return { request, effects, events, withdrawn, silenced, cleanup: () => cleanups.reverse().forEach(callback => callback()) }
}
const body = { kind: 'completion', sessionId: 's1', sessionTitle: 'Project', title: 'Complete', body: 'Project · done', url: 'http://localhost:3080/', theme: {}, openLabel: 'Open', closeLabel: 'Close' }

test('host correlates two pages with the same turn and claims all effects exactly once', async () => {
  const h = harness()
  try {
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 7, reason: { kind: 'completed' } } })
    const result = await Promise.all([h.request('deliver', 'POST', { ...body, clientId: 'a' }), h.request('deliver', 'POST', { ...body, clientId: 'b' })])
    assert.equal(result.filter(item => item.value.delivery === 'duplicate').length, 1)
    assert.equal(h.effects.length, 1)
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 8, reason: { kind: 'completed' } } })
    await h.request('deliver', 'POST', body)
    assert.equal(h.effects.length, 2)
  } finally { h.cleanup() }
})

test('another page attending this session suppresses both channels; closing an unrelated page cannot clear it', async () => {
  const h = harness()
  try {
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })
    await h.request('presence', 'POST', { clientId: 'a', sessionId: 's1', active: true, focused: true, visible: true })
    await h.request('presence', 'POST', { clientId: 'b', active: false })
    const result = await h.request('deliver', 'POST', body)
    assert.equal(result.value.delivery, 'suppressed')
    assert.equal(h.effects.length, 0)
  } finally { h.cleanup() }
})

test('persisted disabled settings control host delivery even if a stale client asks for a popup', async () => {
  const h = harness()
  try {
    await h.request('settings', 'POST', { revision: 0, patch: { enabled: false } })
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })
    const result = await h.request('deliver', 'POST', body)
    assert.equal(result.value.delivery, 'suppressed')
    assert.equal(h.effects.length, 0)
    assert.equal((await h.request('settings', 'POST', { revision: 0, patch: { enabled: true } })).status, 409)
  } finally { h.cleanup() }
})

test('unauthenticated requests cannot read preferences, change focus or trigger delivery', async () => {
  const h = harness(401)
  try {
    for (const [path, method] of [['settings', 'GET'], ['settings', 'POST'], ['presence', 'POST'], ['deliver', 'POST'], ['desktop-status', 'GET'], ['windows-notify', 'POST']]) {
      assert.equal((await h.request(path, method, body)).status, 401)
    }
    assert.equal(h.effects.length, 0)
  } finally { h.cleanup() }
})


test('online but unresponsive Web presence cannot permanently suppress host fallback', async () => {
  const h = harness(undefined, 15)
  try {
    await h.request('presence', 'POST', { clientId: 'frozen', active: true, focused: false, visible: true, sessionId: 's1', presentation: { url: 'http://localhost:3080/', theme: {} } })
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 42, reason: { kind: 'completed' } } })
    await new Promise(resolve => setTimeout(resolve, 40))
    assert.equal(h.effects.length, 1)
    assert.equal(Array.isArray(h.effects[0]), false, 'initial presence supplies the theme before any Web delivery')
  } finally { h.cleanup() }
})


test('authenticated non-owner peers cannot manage notification preferences', async () => {
  const h = harness(undefined, 10000, 'reader')
  try { assert.equal((await h.request('settings')).status, 403) }
  finally { h.cleanup() }
})

test('an older client delivery and the new delivery route share a host claim', async () => {
  const h = harness()
  try {
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })
    await h.request('windows-notify', 'POST', body)
    assert.equal((await h.request('deliver', 'POST', body)).value.delivery, 'duplicate')
    assert.equal(h.effects.length, 1)
  } finally { h.cleanup() }
})


test('channel changes retract queued windows independently from muting their audio', async () => {
  const h = harness()
  try {
    h.events.get('session/event')({ id: 's1', header: {} }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })
    await h.request('deliver', 'POST', body)
    await h.request('settings', 'POST', { revision: 0, patch: { popup: { enabled: false } } })
    assert.equal(h.withdrawn.length, 1)
    assert.equal(h.silenced.length, 0)
    await h.request('settings', 'POST', { revision: 1, patch: { sound: { enabled: false } } })
    assert.equal(h.silenced.length, 1)
  } finally { h.cleanup() }
})

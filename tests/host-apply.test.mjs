import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { apply } from '../src/host/index.js'

function fakeContext(rejection) {
  const routes = new Map()
  const events = new Map()
  const scope = {
    webServer: {
      register(route) {
        routes.set(route.path, route)
        return () => routes.delete(route.path)
      },
    },
    effect(callback) {
      const cleanup = callback()
      return cleanup ?? (() => {})
    },
  }
  const ctx = {
    get: key => key === 'connection' ? { requestRejection: () => rejection, admit: () => ({ peer: { principal: { kind: 'owner' } } }) } : undefined,
    inject(deps, callback) {
      if (deps.includes('webServer')) callback(scope)
    },
    on(name, handler) {
      events.set(name, handler)
      return () => {}
    },
    effect(callback) {
      const cleanup = callback()
      return cleanup ?? (() => {})
    },
  }
  apply(ctx)
  return { routes, events }
}

test('host half registers presence and windows routes and the session event', () => {
  const { routes, events } = fakeContext()
  assert.ok(routes.has('/dsh-notify-interactive/presence'))
  assert.ok(routes.has('/dsh-notify-interactive/windows-notify'))
  assert.ok(events.has('session/event'))
})

test('host presence route accepts an active web peer', async () => {
  const { routes } = fakeContext()
  const route = routes.get('/dsh-notify-interactive/presence')
  const req = new EventEmitter()
  req.method = 'POST'
  const res = {
    status: 0,
    writeHead(status) {
      this.status = status
    },
    end() {},
  }
  const pending = route.handler(req, res)
  req.emit('data', Buffer.from(JSON.stringify({
    active: true,
    sessionId: 's1',
    focused: true,
    visible: true,
  })))
  req.emit('end')
  await pending
  assert.equal(res.status, 204)
})

test('desktop status route reports capability without exposing local paths', () => {
  const { routes } = fakeContext()
  let status
  let payload
  routes.get('/dsh-notify-interactive/desktop-status').handler({ method: 'GET' }, {
    writeHead: value => { status = value }, end: value => { payload = JSON.parse(value) },
  })
  assert.equal(status, 200)
  assert.equal(typeof payload.enabled, 'boolean')
  assert.equal(typeof payload.available, 'boolean')
  assert.equal(payload.scope, 'reminders')
  assert.equal(payload.native, true)
  assert.equal(payload.available, false)
  assert.ok(['missing-origin', 'missing-windows', 'disabled'].includes(payload.reason))
})

test('disabling Windows at startup keeps old clients and test buttons from opening a fallback', async t => {
  const previous = process.env.DSH_NOTIFY_WINDOWS
  process.env.DSH_NOTIFY_WINDOWS = '0'
  t.after(() => { if (previous === undefined) delete process.env.DSH_NOTIFY_WINDOWS; else process.env.DSH_NOTIFY_WINDOWS = previous })
  const { routes } = fakeContext()
  for (const [path, kind] of [['deliver', 'completion'], ['windows-notify', 'demo-completion']]) {
    const req = new EventEmitter()
    req.method = 'POST'
    let status, result
    const done = routes.get('/dsh-notify-interactive/' + path).handler(req, {
      writeHead(code) { status = code }, end(text) { result = JSON.parse(text) },
    })
    req.emit('data', Buffer.from(JSON.stringify({ sessionId: 'session', kind })))
    req.emit('end')
    await done
    assert.equal(status, 503)
    assert.equal(result.delivery, 'disabled')
  }
})

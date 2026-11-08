import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { apply } from '../src/host/index.js'

function fakeContext() {
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

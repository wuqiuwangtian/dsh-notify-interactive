import { applyHost } from '../lib/index.js'
import { createCompanion } from '../src/host/companion.js'
import { EventEmitter } from 'node:events'
const routes = new Map(), handlers = new Map(), cleanups = [], desktop = []
const effect = callback => { const cleanup = callback(); if (typeof cleanup === 'function') cleanups.push(cleanup) }
const companion = createCompanion({ onEvent: event => desktop.push(event) })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const theme = { '--dsw-alias-bg-base': '#14161b', '--dsw-alias-bg-layer-1': '#20232b', '--dsw-alias-bg-layer-2': '#2b2f38', '--dsw-alias-label-primary': '#edf0f7', '--dsw-alias-label-secondary': '#b3bbc9', '--dsw-alias-border-l1': '#343a46', '--dsw-alias-brand-primary': '#4d6bfe', '--dsw-alias-label-primary-foreground': '#fff', '--ds-font-family': 'Segoe UI, sans-serif' }
const message = { sessionId: 'smoke-session', kind: 'completion', sessionTitle: '投递协调验证', title: 'DSH', body: '本轮已结束。', url: 'http://localhost:3080/', openLabel: '打开会话', closeLabel: '关闭', theme }
function check(condition, reason) { if (!condition) throw Error(reason) }
async function request(path, body, method = 'POST') {
  const req = new EventEmitter(); req.method = method
  let code, value
  const task = routes.get(`/dsh-notify-interactive/${path}`).handler(req, { writeHead: status => { code = status }, end: data => { value = data ? JSON.parse(data) : null }, setHeader: () => {} })
  if (body) req.emit('data', Buffer.from(JSON.stringify(body)))
  req.emit('end'); await task
  if (code >= 400) throw Error(`route-${path}-${code}`)
  return value
}
function event(type, data) { handlers.get('session/event')({ id: message.sessionId, header: { cwd: '/tmp/demo' } }, { type, data }) }
function end(turn) { event('turn/end', { turn, reason: { kind: 'completed' } }) }
try {
  applyHost({
    get: key => key === 'connection' ? { requestRejection: () => undefined, admit: () => ({ peer: { principal: { kind: 'owner' } } }) } : undefined,
    inject: (_dependencies, callback) => callback({ effect, webServer: { register: route => { routes.set(route.path, route); return () => {} } } }),
    on: (type, handler) => handlers.set(type, handler), effect,
  }, { companion, legacy: () => { throw Error('unexpected-native-fallback') } })
  let settings = await request('settings', undefined, 'GET')
  settings = await request('settings', { revision: settings.revision, patch: { popup: { enabled: false }, sound: { enabled: true } } })
  end(1)
  const soundOnly = await request('deliver', message)
  await pause(1200)
  check(soundOnly.delivery === 'rendered' && desktop.some(event => event.type === 'audio' && event.played) && desktop.some(event => event.type === 'rendered' && !event.visible), 'sound-only-failed')
  settings = await request('settings', { revision: settings.revision, patch: { sound: { enabled: false } } })
  end(2)
  check((await request('deliver', message)).delivery === 'suppressed', 'both-disabled-failed')
  settings = await request('settings', { revision: settings.revision, patch: { popup: { enabled: true } } })
  const audioCount = desktop.filter(event => event.type === 'audio').length
  end(3)
  check((await request('deliver', message)).delivery === 'rendered', 'popup-only-failed')
  check((await request('deliver', { ...message, clientId: 'another-page' })).delivery === 'duplicate', 'duplicate-delivery')
  event('approval/asked', { id: 'permission-1', callId: 'tool-1', toolName: 'demo' })
  const approval = await request('deliver', { ...message, kind: 'approval', callId: 'tool-1', body: '权限申请演示；不会作答。' })
  check(approval.delivery === 'queued', 'queue-failed')
  await companion.withdraw(JSON.stringify([message.sessionId, 'completion', 3]))
  await pause(500)
  event('approval/decided', { id: 'permission-1', outcome: 'rejected' })
  await pause(300)
  event('turn/start', { turn: 4 }); end(4)
  const previous = desktop.filter(event => event.type === 'rendered').length
  await pause(2300)
  check(desktop.filter(event => event.type === 'rendered').length > previous, 'host-fallback-failed')
  check(desktop.filter(event => event.type === 'audio').length === audioCount, 'muted-delivery-played-audio')
  console.log(JSON.stringify({ soundOnly: 'passed', bothOff: 'passed', popupOnly: 'passed', duplicate: 'passed', queue: 'passed', hostFallback: 'passed' }))
} finally { for (const cleanup of cleanups.reverse()) cleanup() }

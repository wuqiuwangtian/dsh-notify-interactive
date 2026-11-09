import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { apply } from '../lib/index.js'
import { createCompanion } from '../src/host/companion.js'
import { SOUND_PRESETS } from '../src/audio/sounds.js'
import { renderPresetToDataUrl } from '../src/audio/wav.js'

// Visible test fixture tokens; production receives computed tokens from DSH.
const theme = {
  '--dsw-alias-bg-base': '#1e1f22', '--dsw-alias-label-primary': '#e6e6e6',
  '--dsw-alias-bg-layer-2': '#2d2e32', '--dsw-alias-border-l1': '#555',
  '--dsw-alias-brand-primary': '#4d6bfe', '--ds-font-family': 'Segoe UI, sans-serif',
}
const events = []
let child
const companion = createCompanion({ spawn: (...args) => { child = spawn(...args); return child }, onEvent: event => { events.push(event); console.log(JSON.stringify(event)) } })
try {
  for (const popup of [true, false, true]) {
    const result = await companion.deliver({
      title: 'DSH 提醒原型', body: popup ? 'WSL → Windows：无需预开通知窗口。此为演示，不是真实会话事件。' : '',
      openLabel: '打开 DSH', url: 'http://localhost:3000/?dsh-notify-session=demo',
      theme, popup, audio: popup ? '' : renderPresetToDataUrl(SOUND_PRESETS[0]), volume: 0.2,
    })
    console.log(JSON.stringify({ popup, result }))
    if (result.status !== 'rendered' || result.visible !== popup || result.focused === true) throw new Error('desktop smoke failed')
    await new Promise(resolve => setTimeout(resolve, 1200))
  }
  const exited = new Promise(resolve => child.once('exit', resolve))
  child.kill()
  await exited
  const recovered = await companion.deliver({ title: 'DSH 重连测试', body: '进程中断后自动重新启动。', openLabel: '打开 DSH', url: 'http://localhost:3000/', theme, popup: true, audio: '', volume: 0 })
  console.log(JSON.stringify({ recovery: recovered }))
  if (recovered.status !== 'rendered' || recovered.focused === true) throw new Error('recovery failed')
  if (!events.some(event => event.type === 'audio' && event.played === true)) throw new Error('desktop audio did not start')
} finally { companion.dispose() }

// Use the real host route and Windows process, with a mock DSH webServer only.
const routes = new Map()
const cleanups = []
const effect = callback => { const cleanup = callback(); if (typeof cleanup === 'function') cleanups.push(cleanup) }
const previous = process.env.DSH_NOTIFY_COMPANION
delete process.env.DSH_NOTIFY_COMPANION
try {
  apply({ inject: (_dependencies, callback) => callback({ webServer: { register: route => { routes.set(route.path, route); return () => {} } }, effect }), on: () => {}, effect })
  let capability
  routes.get('/dsh-notify-interactive/desktop-status').handler({ method: 'GET' }, {
    writeHead: () => {}, end: value => { capability = JSON.parse(value) },
  })
  console.log(JSON.stringify({ desktopStatus: capability }))
  if (!capability.enabled || capability.mode !== 'automatic') throw new Error('automatic enablement failed')
  const request = new EventEmitter()
  request.method = 'POST'
  let status
  let response
  const task = routes.get('/dsh-notify-interactive/windows-notify').handler(request, {
    writeHead: value => { status = value }, end: value => { response = JSON.parse(value) },
  })
  request.emit('data', Buffer.from(JSON.stringify({ kind: 'completion', sessionId: 'demo', title: 'DSH 宿主路由测试', body: '演示完成事件经真实宿主处理。', url: 'http://localhost:3000/', silent: true, theme })))
  request.emit('end')
  await task
  console.log(JSON.stringify({ hostRoute: { status, ...response } }))
  if (status !== 200 || response.delivery !== 'rendered' || response.shown !== true) throw new Error('host route smoke failed')
} finally {
  for (const cleanup of cleanups.reverse()) cleanup()
  if (previous === undefined) delete process.env.DSH_NOTIFY_COMPANION
  else process.env.DSH_NOTIFY_COMPANION = previous
}

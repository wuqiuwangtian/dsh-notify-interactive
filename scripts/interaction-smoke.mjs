// Real Windows renderer + built Host; the DSH context and Pending objects are synthetic.
import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { applyHost } from '../lib/index.js'
import { createCompanion, resolveCompanionLaunch } from '../src/host/companion.js'
import { createInteractionBridge } from '../src/client/interactions.js'
const run = promisify(execFile)
const powershell = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
const port = 42000 + Math.floor(Math.random() * 10000)
const routes = new Map(), handlers = new Map(), cleanups = [], reports = [], answers = []
let submit
const companion = createCompanion({ launch: () => { const launch = resolveCompanionLaunch(); return { ...launch, args: [...launch.args, `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'] } },
  onEvent: event => { reports.push(event); if (event.type === 'interaction') void submit(event).then(result => companion.interactionResult(event.id, event.actionId, result.status)) } })
companion.onInteraction = handler => { submit = handler }
const effect = callback => { const cleanup = callback(); if (typeof cleanup === 'function') cleanups.push(cleanup) }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const statuses = new Map()
function check(condition, reason) { if (!condition) throw Error(reason) }
async function until(predicate) {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) { if (await predicate()) return; await pause(100) }
  throw Error('smoke-timeout')
}
async function request(path, body, method = 'POST') {
  const req = new EventEmitter(); req.method = method
  let code, value
  const task = routes.get(`/dsh-notify-interactive/${path}`).handler(req, { writeHead: status => { code = status }, end: data => { value = data ? JSON.parse(data) : null }, setHeader: () => {} })
  if (body) req.emit('data', Buffer.from(JSON.stringify(body)))
  req.emit('end'); await task
  return { ok: code < 400, json: async () => value }
}
const bridge = createInteractionBridge({ clientId: 'synthetic-owner', getStatus: () => statuses, intervalMs: 100, makeToken: () => `pending-${Math.random()}`, fetch: async (path, init) => request(path.split('/').at(-1), JSON.parse(init.body)) })
const theme = { '--dsw-alias-bg-base': '#14161b', '--dsw-alias-bg-layer-1': '#20232b', '--dsw-alias-bg-layer-2': '#2b2f38', '--dsw-alias-label-primary': '#edf0f7', '--dsw-alias-label-secondary': '#b3bbc9', '--dsw-alias-border-l1': '#343a46', '--dsw-alias-brand-primary': '#4d6bfe', '--dsw-alias-label-primary-foreground': '#fff', '--ds-font-family': 'Segoe UI, sans-serif' }
function emit(type, data) { handlers.get('session/event')({ id: 'synthetic', header: {} }, { type, data }) }
async function show(kind, callId) {
  await bridge.sync()
  const result = await (await request('deliver', { kind, callId, sessionId: 'synthetic', sessionTitle: '交互链路验证（模拟会话）', title: 'DSH', body: 'Synthetic', url: 'http://localhost:3080/', openLabel: '打开会话', closeLabel: '关闭', theme })).json()
  check(['rendered', 'queued'].includes(result.delivery), `delivery-${result.delivery}`)
  await until(() => evaluate(`view?.callId === ${JSON.stringify(callId)}`))
}
async function cdp(method, params) {
  // Debugging is limited to this smoke process's loopback endpoint, never the user's browser.
  const encoded = Buffer.from(JSON.stringify({ id: 1, method, params })).toString('base64')
  const command = `
$ErrorActionPreference = 'Stop'
$target = @(Invoke-RestMethod 'http://127.0.0.1:${port}/json/list' | Where-Object { $_.type -eq 'page' -and $_.url -like 'file:*index.html' })[0]
if (!$target) { throw 'own-renderer-not-found' }
$ws = New-Object System.Net.WebSockets.ClientWebSocket
[void]$ws.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
$message = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}'))
$bytes = [Text.Encoding]::UTF8.GetBytes($message)
[void]$ws.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
$buffer = New-Object byte[] 131072
$cts = New-Object Threading.CancellationTokenSource
$cts.CancelAfter(10000)
do {
  $stream = New-Object IO.MemoryStream
  do { $received = $ws.ReceiveAsync([ArraySegment[byte]]::new($buffer), $cts.Token).GetAwaiter().GetResult(); $stream.Write($buffer, 0, $received.Count) } while (!$received.EndOfMessage)
  $reply = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
} while ($reply.id -ne 1)
$ws.Dispose()
if ($reply.result.exceptionDetails) { throw 'renderer-evaluation-failed' }
$reply.result | ConvertTo-Json -Compress -Depth 12
`
  const { stdout } = await run(powershell, ['-NoProfile', '-NonInteractive', '-Command', command], { timeout: 20000 })
  return JSON.parse(stdout.trim())
}
async function evaluate(expression) { return (await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value }
async function screenshot(name) {
  await until(() => evaluate(`Math.abs(innerHeight - Math.ceil(document.getElementById('card').getBoundingClientRect().height)) <= 1`))
  const capture = await cdp('Page.captureScreenshot', { format: 'png' })
  await writeFile(`/tmp/dsh-notify-p3-${name}.png`, Buffer.from(capture.data, 'base64'))
}
try {
  applyHost({ get: key => key === 'connection' ? { requestRejection: () => undefined, admit: () => ({ peer: { principal: { kind: 'owner' } } }) } : undefined,
    inject: (_dependencies, callback) => callback({ effect, webServer: { register: route => { routes.set(route.path, route); return () => {} } } }), on: (type, handler) => handlers.set(type, handler), effect },
  { companion, available: true, legacy: () => { throw Error('unexpected-legacy-fallback') } })
  let settings = await (await request('settings', undefined, 'GET')).json()
  await request('settings', { revision: settings.revision, patch: { sound: { enabled: false } } })
  bridge.start()
  emit('approval/asked', { id: 'synthetic-approval', callId: 'approval-call', toolName: 'shell', reason: '仅测试模拟 Pending，不执行命令。' })
  statuses.set('synthetic', { pendingInteraction: { kind: 'approval', key: 'local-only', callId: 'approval-call', toolName: 'shell', reason: '仅测试模拟 Pending，不执行命令。', answerable: true,
    answer: async answer => { answers.push(answer); emit('approval/decided', { id: 'synthetic-approval' }); statuses.clear() } } })
  await show('approval', 'approval-call')
  await screenshot('approval')
  check(answers.length === 0, 'answer-without-human-action')
  await evaluate(`(() => { const b = [...document.querySelectorAll('#interaction button')].find(b => b.textContent === '允许一次'); if (!b) throw Error('allow-missing'); b.click(); return true })()`)
  await until(() => answers.length === 1)
  check(answers[0] === 'allowed-once', 'approval-mismatch')
  emit('tool/call', { callId: 'question-call', name: 'ask_user_question' })
  const state = { channel: 'waterfall', closed: false }
  const questions = [
    { id: 'one', question: '选择一个环境', options: [{ label: 'Windows', description: '当前目标桌面' }, { label: 'Linux' }] },
    { id: 'two', question: '选择需要的通知通道', multiSelect: true, options: [{ label: '弹窗' }, { label: '音效' }] },
    { id: 'three', question: '补充说明', options: [] },
  ]
  statuses.set('synthetic', { pendingInteraction: { kind: 'question', key: 'question-local', callId: 'question-call', questions, snapshot: () => state, engage: () => {},
    answer: async answer => { answers.push(answer); emit('tool/result', { callId: 'question-call', message: { content: '{}' } }); statuses.clear() } } })
  await show('question', 'question-call')
  await evaluate(`(() => {
    const fields = [...document.querySelectorAll('fieldset')];
    fields[0].querySelector('input[value="Windows"]').click();
    fields[1].querySelector('input[value="弹窗"]').click();
    fields[1].querySelector('input[value="音效"]').click();
    const custom = fields[1].querySelector('textarea'); custom.value = '保留自定义说明'; custom.dispatchEvent(new Event('input', { bubbles: true }));
    fields[2].querySelector('button.skip').click();
    return true;
  })()`)
  await pause(700)
  const pending = statuses.get('synthetic')
  statuses.clear(); await bridge.sync()
  await until(() => evaluate(`!view && document.querySelectorAll('fieldset').length === 3 && document.querySelectorAll('textarea')[1].value === '保留自定义说明' && document.querySelectorAll('textarea')[1].disabled`))
  statuses.set('synthetic', pending); state.channel = 'rpc'; await bridge.sync()
  await until(() => evaluate(`view?.channel === 'rpc' && document.querySelectorAll('textarea')[1].value === '保留自定义说明' && !document.querySelectorAll('textarea')[1].disabled`))
  await screenshot('question')
  check(answers.length === 1, 'editing-submitted-implicitly')
  check(await evaluate(`(() => { const v = document.querySelector('textarea'); v.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })); return document.querySelectorAll('fieldset').length })()`) === 3, 'batch-truncated')
  await evaluate(`(() => { [...document.querySelectorAll('#interaction button')].find(b => b.textContent === '提交回答').click(); return true })()`)
  await until(() => answers.length === 2)
  check(JSON.stringify(answers[1]) === JSON.stringify({ answers: [{ id: 'one', selected: ['Windows'] }, { id: 'two', selected: ['弹窗', '音效'], custom: '保留自定义说明' }, { id: 'three', selected: [] }] }), 'question-batch-mismatch')
  emit('tool/call', { callId: 'plan-call', name: 'exit_plan_mode' })
  statuses.set('synthetic', { pendingInteraction: { kind: 'plan-review', key: 'plan-local', snapshot: () => ({ channel: 'waterfall' }), engage: () => {},
    questions: [{ id: 'plan', question: '是否按此计划继续？', detail: '1. 核对当前请求\n2. 由用户明确提交\n3. 验证结果', intent: { kind: 'plan-review', approve: '按计划继续', callId: 'plan-call' }, options: [{ label: '按计划继续' }, { label: '需要修改' }] }],
    answer: async answer => { answers.push(answer); emit('tool/result', { callId: 'plan-call', message: { content: '{}' } }); statuses.clear() } } })
  await show('plan-review', 'plan-call')
  await screenshot('plan')
  await evaluate(`(() => { document.querySelector('input[value="需要修改"]').click(); return true })()`)
  await pause(500)
  await evaluate(`(() => { [...document.querySelectorAll('#interaction button')].find(b => b.textContent === '提交回答').click(); return true })()`)
  await until(() => answers.length === 3)
  check(answers[2].answers[0].id === 'plan' && answers[2].answers[0].selected[0] === '需要修改', 'plan-answer-mismatch')
  emit('approval/asked', { id: 'reject-approval', callId: 'reject-call', toolName: 'shell', reason: '验证拒绝操作' })
  statuses.set('synthetic', { pendingInteraction: { kind: 'approval', key: 'reject-local', callId: 'reject-call', toolName: 'shell', reason: '验证拒绝操作', answerable: true,
    answer: async answer => { answers.push(answer); emit('approval/decided', { id: 'reject-approval' }); statuses.clear() } } })
  await show('approval', 'reject-call')
  await evaluate(`(() => { [...document.querySelectorAll('#interaction button')].find(b => b.textContent === '拒绝').click(); return true })()`)
  await until(() => answers.length === 4)
  check(answers[3] === 'rejected', 'rejection-mismatch')
  console.log(JSON.stringify({ windowsApprovalClick: 'passed', rejection: 'passed', fullQuestionBatch: 'passed', customAndMulti: 'passed', explicitSkip: 'passed', planReview: 'passed', noImplicitAnswer: 'passed', draftRecovery: 'passed', contentHeight: 'passed' }))
} finally { bridge.stop(); for (const cleanup of cleanups.reverse()) cleanup() }

import { randomUUID } from 'node:crypto'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, readdir, rm, stat, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { presentationKey } from '../interaction/schema.js'

const run = promisify(execFile)
const nonce = () => randomUUID().replaceAll('-', '')
const keyOf = view => view && !view.blocked && JSON.stringify([view.instanceId, view.eventId, view.token, presentationKey(view)])

export function quickActions(view) {
  if (!view || view.blocked) return null
  if (view.kind === 'approval') {
    const prompt = [view.toolName, view.description || view.reason].filter(Boolean).join(' · ')
    if (!view.toolName || prompt.length > 180 || /[\r\n]/.test(prompt)) return null
    return { prompt, buttons: [
      { label: '允许一次', answer: 'allowed-once' }, { label: '拒绝', answer: 'rejected' },
    ] }
  }
  if (view.kind !== 'question' || view.questions.length !== 1) return null
  const [q] = view.questions
  const reserved = ['发送回答', '跳过此题']
  if (!q.question.trim() || q.question.length > 100 || q.detail || q.intent || q.multiSelect || q.options.length > 3 ||
      q.options.some(o => o.description || !o.label.trim() || o.label.length > 18 || reserved.includes(o.label))) return null
  const answer = selected => ({ answers: [{ id: q.id, selected }] })
  return { prompt: q.question, input: true, buttons: [
    ...q.options.map(o => ({ label: o.label, answer: answer([o.label]) })),
    { label: reserved[0], questionId: q.id }, { label: reserved[1], answer: answer([]) },
  ] }
}

export async function startToastActivator(shell, instance) {
  const [source, script] = await Promise.all(['ToastActivator.cs', 'register-toast.ps1'].map(name => readFile(new URL(name, import.meta.url), 'utf8')))
  const compiled = await new Promise((resolve, reject) => {
    const child = execFile(shell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      { windowsHide: true, timeout: 20000 }, (err, stdout) => err ? reject(Error('toast-activator-registration-failed')) : resolve(Buffer.from(stdout.trim(), 'base64').toString('utf8')))
    child.stdin.on('error', reject)
    child.stdin.end(Buffer.from(source).toString('base64'))
  })
  const executable = process.platform === 'win32' ? compiled : (await run('wslpath', ['-u', compiled])).stdout.trim()
  const helper = spawn(executable, ['--host', instance], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
  helper.stdin.on('error', () => {}) // The Windows process may already have exited.
  const closed = new Promise(resolve => helper.once('close', resolve))
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('toast-activator-timeout')), 8000)
      let output = ''
      helper.once('error', reject)
      helper.stdout.on('data', chunk => {
        output += chunk
        if (output.trim() === 'ready') { clearTimeout(timer); resolve() }
      })
      closed.then(() => { clearTimeout(timer); reject(Error('toast-activator-exited')) })
    })
  } catch (error) { helper.kill(); throw error }
  return { base: dirname(executable), stop: () => helper.stdin.end(), closed }
}

/** The mailbox and button references belong to one running host. Only explicit Windows callbacks write replies. */
export function createToastActions({ register, submit, withdraw = () => {}, pollMs = 300 }) {
  const instance = nonce(), events = new Map(), buttons = new Map(), processing = new Set()
  let folder, startup, helper, timer, reading = false, disposed = false
  function revoke(id) {
    const event = events.get(id)
    if (!event) return
    for (const token of event.tokens) buttons.delete(token)
    events.delete(id)
  }
  async function consume(name) {
    const file = join(folder, name)
    const token = name.slice(0, -6), button = buttons.get(token)
    if (!button) { await unlink(file); return }
    const { event } = button
    // Reserve all sibling buttons synchronously, but let withdrawal during file I/O cancel this click.
    for (const sibling of event.tokens) buttons.delete(sibling)
    try { await deliverAnswer(file, event, button) }
    finally { if (events.get(event.id) === event) revoke(event.id) }
  }
  async function deliverAnswer(file, event, button) {
    const info = await stat(file)
    let reply
    try { if (info.size <= 32000 && Date.now() - info.mtimeMs < 8000) reply = await readFile(file, 'utf8') }
    finally { await unlink(file) }
    const view = event.getView()
    if (disposed || events.get(event.id) !== event || reply === undefined || !event.live() || keyOf(view) !== event.key) return
    let answer = button.answer
    if (button.questionId !== undefined) {
      reply = reply.trim()
      if (!reply || reply.length > 8000) { await event.onFailure(); return }
      answer = { answers: [{ id: button.questionId, selected: [], custom: reply }] }
    }
    const { status } = await submit({ instanceId: view.instanceId, eventId: event.id, token: view.token, action: 'answer', answer })
    if (status !== 'success' && !disposed && event.live()) await event.onFailure()
  }
  async function poll() {
    if (reading || disposed) return
    reading = true
    try {
      for (const name of await readdir(folder)) if (/^[a-f0-9]{32}\.reply$/.test(name) && !processing.has(name)) {
        // A Web acknowledgement can take seconds. Independent requests can proceed.
        processing.add(name)
        void consume(name).catch(() => {}).finally(() => processing.delete(name))
      }
    } finally { reading = false }
  }
  async function prepare() {
    if (disposed) return
    startup ??= (async () => {
      helper = await register(instance)
      const path = join(helper.base, instance)
      await mkdir(path, { recursive: true })
      if (disposed) { helper.stop(); await rm(path, { recursive: true, force: true }); return }
      folder = path
      helper.closed.then(() => {
        clearInterval(timer)
        if (!disposed) for (const id of events.keys()) withdraw(id)
        events.clear()
        buttons.clear()
        folder = undefined
        startup = undefined
      })
      timer = setInterval(() => void poll().catch(() => {}), pollMs)
      timer.unref?.()
    })().catch(error => { helper?.stop(); startup = undefined; throw error })
    return startup
  }
  return { prepare, revoke,
    bind(id, getView, live, onFailure) {
      revoke(id)
      const view = getView(), form = quickActions(view)
      if (!folder || disposed || !form || events.size >= 512 || !live() || view.eventId !== id) return null
      const event = { id, key: keyOf(view), getView, live, onFailure, tokens: [] }
      events.set(id, event)
      return { prompt: form.prompt, input: form.input, buttons: form.buttons.map(button => {
        const token = nonce()
        buttons.set(token, { ...button, event })
        event.tokens.push(token)
        return { label: button.label, argument: instance + '/' + token }
      }) }
    },
    current(id, view) { return events.has(id) && events.get(id).key === keyOf(view) },
    changed(id, view) {
      if (!events.has(id) || events.get(id).key === keyOf(view)) return false
      revoke(id)
      return true
    },
    dispose() {
      disposed = true
      helper?.stop()
      clearInterval(timer)
      events.clear()
      buttons.clear()
      if (folder) return rm(folder, { recursive: true, force: true }).catch(() => {})
    },
  }
}

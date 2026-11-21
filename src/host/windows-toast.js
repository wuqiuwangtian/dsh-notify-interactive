import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createToastActions, startToastActivator } from './toast-actions.js'
import { SOUND_PRESETS } from '../audio/sounds.js'
import { renderPresetToDataUrl } from '../audio/wav.js'

export const windowsShell = process.platform === 'win32'
  ? join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe')
  : '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 16)
const historyGroup = (profile, pending) => digest(JSON.stringify([process.env.WSL_DISTRO_NAME, profile, pending]))
export const notificationProfileId = profile => historyGroup(profile, false)
const script = new URL('./notification.ps1', import.meta.url)

async function callWindows(packet) {
  const source = await readFile(script, 'utf8')
  const command = Buffer.from(source, 'utf16le').toString('base64')
  const input = Buffer.from(JSON.stringify(packet)).toString('base64')
  return new Promise((resolve, reject) => {
    const child = execFile(windowsShell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', command],
      { windowsHide: true, timeout: 15000 }, (error, stdout) => {
        if (error) reject(new Error(`windows-notification-call-failed (${error.code ?? error.signal})`))
        else resolve(stdout.trim())
      })
    child.stdin.on('error', reject)
    child.stdin.end(input)
  })
}

export async function removeProfileHistory(profile) {
  for (const pending of [false, true]) await callWindows({ removeGroup: historyGroup(profile, pending) })
}

export function nativeToast(fact, origin, profile, payload) {
  const url = new URL(origin)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || !fact.sessionId) throw Error('invalid-notification-target')
  url.searchParams.set('dsh-notify-session', fact.sessionId)
  url.searchParams.set('dsh-notify-profile', historyGroup(profile, false))
  return { url: url.href, title: payload.sessionTitle || payload.title, body: payload.body,
    group: historyGroup(profile, fact.kind !== 'completion'), tag: digest(fact.id) }
}

export function createToastTransport(origin, profile, send = callWindows, submit) {
  const pending = new Set()
  const group = historyGroup(profile, true)
  const remove = id => send({ group, removeTag: digest(id) })
  const withdraw = id => {
    if (pending.delete(id)) return remove(id).catch(() => console.warn('[dsh-notify-interactive] Windows history removal failed'))
  }
  const actions = submit && createToastActions({ register: instance => startToastActivator(windowsShell, instance), submit, withdraw })
  let disposed = false
  let actionError = false, deliveryError = false
  const prepare = () => actions?.prepare().then(() => { actionError = false }, () => { actionError = true })
  void prepare()
  let ready
  function initialize() {
    ready ??= send({ removeGroup: group }).catch(error => { ready = undefined; deliveryError = true; throw error })
    return ready
  }
  initialize().catch(() => {}) // Retry a transient startup failure on delivery.
  return {
    reason: () => deliveryError ? 'delivery-failed' : actionError ? 'actions-unavailable' : undefined,
    profileId: notificationProfileId(profile),
    async deliver({ fact, payload, getPolicy, isCurrent, getInteraction }) {
      await initialize()
      const interactive = actions && getInteraction && ['approval', 'question'].includes(fact.kind)
      if (interactive && getPolicy().popup) await prepare()
      const policy = getPolicy()
      if (disposed || !isCurrent() || (!policy.popup && !policy.sound)) return { shown: false, delivery: 'suppressed' }
      const preset = policy.sound && SOUND_PRESETS.find(item => item.id === policy.preset)
      const wav = preset ? renderPresetToDataUrl(preset, policy.volume).split(',')[1] : ''
      const toast = nativeToast(fact, origin, profile, payload)
      const live = () => !disposed && isCurrent() && getPolicy().popup
      const failure = async () => {
        if (!live()) return
        await send({ ...toast, body: '请打开会话核对请求状态。', popup: true })
        if (!live()) await remove(fact.id)
      }
      const form = interactive && policy.popup ? actions.bind(fact.id, getInteraction, live, failure) : null
      if (form) toast.body = form.prompt
      let status
      try { status = await send({ ...toast, form, popup: policy.popup, wav }); deliveryError = false }
      catch (error) { deliveryError = true; throw error }
      finally { if (status !== 'accepted') actions?.revoke(fact.id) }
      if (policy.popup && status === 'accepted' && fact.kind !== 'completion') {
        if (live() && (!form || actions.current(fact.id, getInteraction()))) pending.add(fact.id)
        else {
          actions?.revoke(fact.id)
          await remove(fact.id)
        }
      }
      return { shown: false, delivery: status }
    },
    update(id, view) {
      if (pending.has(id) && actions?.changed(id, view)) void withdraw(id)
    },
    dispose() {
      disposed = true
      void actions?.dispose()
    },
    retire(fact) {
      actions?.revoke(fact.id)
      return withdraw(fact.id)
    },
  }
}

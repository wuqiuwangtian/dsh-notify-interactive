import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { SOUND_PRESETS } from '../audio/sounds.js'
import { renderPresetToDataUrl } from '../audio/wav.js'

const shell = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 16)
const historyGroup = (profile, pending) => digest(JSON.stringify([process.env.WSL_DISTRO_NAME, profile, pending]))
const script = new URL('./notification.ps1', import.meta.url)

async function callWindows(packet) {
  const source = await readFile(script, 'utf8')
  const command = Buffer.from(source, 'utf16le').toString('base64')
  const input = Buffer.from(JSON.stringify(packet)).toString('base64')
  return new Promise((resolve, reject) => {
    const child = execFile(shell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', command],
      { windowsHide: true, timeout: 15000 }, (error, stdout) => {
        if (error) reject(new Error(`windows-notification-call-failed (${error.code ?? error.signal})`))
        else resolve(stdout.trim())
      })
    child.stdin.on('error', reject)
    child.stdin.end(input)
  })
}

export async function removePreviewHistory(profile) {
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

export function createToastTransport(origin, profile, send = callWindows) {
  const pending = new Set()
  const group = historyGroup(profile, true)
  let ready
  function initialize() {
    ready ??= send({ removeGroup: group }).catch(error => { ready = undefined; throw error })
    return ready
  }
  initialize().catch(() => {}) // Retry a transient startup failure on delivery.
  const remove = id => send({ group, removeTag: digest(id) })
  return {
    profileId: historyGroup(profile, false),
    async deliver({ fact, payload, getPolicy, isCurrent }) {
      await initialize()
      const policy = getPolicy()
      if (!isCurrent() || (!policy.popup && !policy.sound)) return { shown: false, delivery: 'suppressed' }
      const preset = policy.sound && SOUND_PRESETS.find(item => item.id === policy.preset)
      const wav = preset ? renderPresetToDataUrl(preset, policy.volume).split(',')[1] : ''
      const toast = nativeToast(fact, origin, profile, payload)
      const status = await send({ ...toast, popup: policy.popup, wav })
      if (policy.popup && status === 'accepted' && fact.kind !== 'completion') {
        if (isCurrent() && getPolicy().popup) pending.add(fact.id)
        else await remove(fact.id)
      }
      return { shown: false, delivery: status }
    },
    retire(fact) {
      if (pending.delete(fact.id)) return remove(fact.id).catch(() => console.warn('[dsh-notify-interactive] Windows history removal failed'))
    },
  }
}

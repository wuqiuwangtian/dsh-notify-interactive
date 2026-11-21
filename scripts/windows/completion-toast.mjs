import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 16)
const shell = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'

const scriptPath = new URL('./completion-toast.ps1', import.meta.url)

async function callWindows(script, packet) {
  const command = Buffer.from(script, 'utf16le').toString('base64')
  const input = Buffer.from(JSON.stringify(packet)).toString('base64')
  await new Promise((resolve, reject) => {
    const child = execFile(shell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', command],
      { windowsHide: true, timeout: 15000 }, error => {
        if (error) reject(new Error(`windows-notification-call-failed (${error.code ?? error.signal})`))
        else resolve()
      })
    child.stdin.on('error', reject)
    child.stdin.end(input)
  })
}

export async function removePreviewHistory(profile) {
  await callWindows(await readFile(scriptPath, 'utf8'), { removeGroup: digest(profile) })
}

/** The activation URI only contains the harness origin and target session, even after logout. */
export function completionToast(fact, origin, profile, payload) {
  const url = new URL(origin)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || !fact.sessionId) throw Error('invalid-preview-target')
  url.searchParams.set('dsh-notify-session', fact.sessionId)
  return { url: url.href, title: payload.sessionTitle || payload.title, body: payload.body,
    group: digest(profile), tag: digest(fact.id) }
}

export function createToastDelivery(origin, profile) {
  return async ({ fact, payload, getPolicy, isCurrent }) => {
    if (fact.kind !== 'completion') return { shown: false, delivery: 'unsupported-event' }
    const script = await readFile(scriptPath, 'utf8')
    if (!isCurrent() || !getPolicy().popup) return { shown: false, delivery: 'suppressed' }
    const toast = completionToast(fact, origin, profile, payload)
    await callWindows(script, toast)
    console.log('[dsh-notify-interactive] Windows accepted completion', toast.group, toast.tag)
    return { shown: false, delivery: 'accepted' }
  }
}

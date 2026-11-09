import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile, rename, readdir, readFile, rm } from 'node:fs/promises'
import { dirname, resolve, join, win32 } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

export function resolveCompanionLaunch() {
  const base = dirname(fileURLToPath(import.meta.url))
  const directory = [resolve(base, '../companion'), resolve(base, '../../companion')].find(path => existsSync(resolve(path, 'main.cjs')))
  if (!directory) throw new Error('companion-files-missing')
  const wsl = process.platform !== 'win32' && existsSync('/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe')
  const stagedPath = resolve(directory, '.runtime.json')
  if (wsl && existsSync(stagedPath) && !process.env.DSH_NOTIFY_ELECTRON) {
    const staged = JSON.parse(readFileSync(stagedPath, 'utf8'))
    if (!existsSync(staged.executable)) throw new Error('companion-not-installed')
    return { executable: staged.executable, args: [staged.application], mailboxRoot: resolve(dirname(staged.executable), '../bridge'), windowsMailboxRoot: win32.join(staged.application, 'bridge') }
  }
  const executable = process.env.DSH_NOTIFY_ELECTRON ?? resolve(directory, 'node_modules/electron/dist', process.platform === 'win32' || wsl ? 'electron.exe' : 'electron')
  if (!existsSync(executable)) throw new Error('companion-not-installed')
  if (wsl) throw new Error('run-companion-installer-to-stage-windows-files')
  return { executable, args: [directory], mailboxRoot: join(tmpdir(), 'dsh-notify-bridge') }
}

/** Connection-scoped file mailbox; avoids broken Windows GUI stdin over WSL. */
export function createCompanion(options = {}) {
  const launch = options.launch ?? resolveCompanionLaunch
  const spawnProcess = options.spawn ?? spawn
  const pending = new Map()
  let starting
  let active
  let disposed = false

  function settle(id, result) {
    const item = pending.get(id)
    if (!item) return
    clearTimeout(item.timer)
    pending.delete(id)
    item.resolve(result)
  }
  async function command(connection, value) {
    const name = `command-${randomUUID()}`
    const temporary = join(connection.directory, `${name}.tmp`)
    await writeFile(temporary, JSON.stringify(value), { mode: 0o600 })
    await rename(temporary, join(connection.directory, `${name}.json`))
  }
  function start() {
    if (disposed) return Promise.reject(new Error('companion-disposed'))
    if (starting) return starting
    starting = (async () => {
      const config = launch()
      const name = randomUUID()
      const directory = join(config.mailboxRoot, name)
      await mkdir(directory, { recursive: true, mode: 0o700 })
      await writeFile(join(directory, 'lease'), String(Date.now()))
      const applicationDirectory = config.windowsMailboxRoot ? win32.join(config.windowsMailboxRoot, name) : directory
      const connection = { directory, poll: null, heartbeat: null, child: null, reading: false, stopped: false }
      active = connection
      return new Promise((ready, reject) => {
        const startupTimer = setTimeout(() => { reject(new Error('companion-startup-timeout')); stop() }, options.startupMs ?? 15000)
        function stop() {
          if (connection.stopped) return
          connection.stopped = true
          clearTimeout(startupTimer)
          clearInterval(connection.poll)
          clearInterval(connection.heartbeat)
          reject(new Error('companion-exited'))
          for (const [id, item] of pending) if (item.connection === connection) settle(id, { status: 'uncertain', reason: 'companion-exited' })
          connection.child?.kill()
          if (active === connection) { active = undefined; starting = undefined }
          rm(directory, { recursive: true, force: true }).catch(() => {})
        }
        connection.stop = stop
        connection.poll = setInterval(async () => {
          if (connection.reading || connection.stopped) return
          connection.reading = true
          try {
            for (const name of await readdir(directory)) {
              if (!/^event-[a-f0-9-]+\.json$/.test(name)) continue
              const path = join(directory, name)
              const contents = await readFile(path, 'utf8')
              await rm(path)
              if (contents.length > 16000) continue
              const event = JSON.parse(contents)
              if (event.type === 'ready' && event.protocol === 1) { clearTimeout(startupTimer); ready(connection) }
              if (event.type === 'rendered') settle(event.id, { status: 'rendered', visible: event.visible, focused: event.focused })
              if (event.type === 'failed') settle(event.id, { status: 'failed', reason: event.reason })
              options.onEvent?.(event)
            }
          } catch { /* A concurrent shutdown may remove the mailbox. */ }
          finally { connection.reading = false }
        }, options.pollMs ?? 100)
        connection.heartbeat = setInterval(() => writeFile(join(directory, 'lease'), String(Date.now())).catch(stop), 3000)
        try {
          const env = { ...process.env }
          delete env.ELECTRON_RUN_AS_NODE
          connection.child = spawnProcess(config.executable, [...config.args, `--dsh-notify-mailbox=${applicationDirectory}`], { stdio: 'ignore', windowsHide: true, env })
          connection.child.once('error', stop)
          connection.child.once('exit', stop)
          if (disposed) stop()
        } catch { stop() }
      })
    })()
    const attempt = starting
    attempt.catch(() => { if (starting === attempt) starting = undefined })
    return attempt
  }
  return {
    async deliver(payload) {
      let connection
      try { connection = await start() }
      catch (error) { return { status: 'unavailable', reason: error.message } }
      if (disposed || active !== connection) return { status: 'unavailable', reason: 'companion-disconnected' }
      const id = randomUUID()
      return new Promise(resolveResult => {
        const timer = setTimeout(() => settle(id, { status: 'uncertain', reason: 'delivery-timeout' }), options.deliveryMs ?? 5000)
        pending.set(id, { resolve: resolveResult, timer, connection })
        command(connection, { ...payload, id, type: 'deliver' }).catch(() => settle(id, { status: 'uncertain', reason: 'mailbox-write-failed' }))
      })
    },
    dispose() {
      disposed = true
      for (const [id] of pending) settle(id, { status: 'unavailable', reason: 'companion-disposed' })
      if (active) {
        const connection = active
        command(connection, { type: 'shutdown' }).catch(() => {})
        // Leave enough time for Windows to consume shutdown before deleting files.
        const timer = setTimeout(() => connection.stop(), 1500)
        timer.unref?.()
      }
    },
  }
}

/** Installation is sufficient by default; explicit 0 retains the legacy path. */
export function getCompanionStatus(env = process.env, resolveLaunch = resolveCompanionLaunch) {
  let available = false
  try { resolveLaunch(); available = true } catch { /* Only report capability, never local paths. */ }
  const mode = env.DSH_NOTIFY_COMPANION === '0' ? 'disabled' : env.DSH_NOTIFY_COMPANION === '1' ? 'enabled' : 'automatic'
  return { mode, available, enabled: mode !== 'disabled' && (mode === 'enabled' || available), scope: 'completion' }
}

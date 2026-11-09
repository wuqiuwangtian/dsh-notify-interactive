import { cp, mkdir, writeFile, readFile, readdir, stat, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createHash, randomUUID } from 'node:crypto'
import { join, win32 } from 'node:path'

const directory = fileURLToPath(new URL('../companion', import.meta.url))
const powershell = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
if (process.platform !== 'win32' && existsSync(powershell)) {
  const localAppData = execFileSync(powershell, ['-NoProfile', '-NonInteractive', '-Command', '[Environment]::GetFolderPath("LocalApplicationData")'], { encoding: 'utf8' }).trim()
  const windowsDirectory = win32.join(localAppData, 'DSHNotifyInteractive', 'companion')
  const target = execFileSync('wslpath', ['-u', windowsDirectory], { encoding: 'utf8' }).trim()
  await mkdir(target, { recursive: true })
  const sourceRuntime = join(directory, 'node_modules/electron/dist')
  const version = (await readFile(join(sourceRuntime, 'version'), 'utf8')).trim()
  const installedVersion = await readFile(join(target, 'runtime/version'), 'utf8').catch(() => '')
  const runtimeName = installedVersion.trim() === version ? 'runtime' : `runtime-${version}`
  // Reuse identical files: Windows locks loaded DLLs while the companion runs.
  // New versions get their own directory rather than replacing an active runtime.
  await cp(sourceRuntime, join(target, runtimeName), { recursive: true, force: false })
  const previousRevision = await readFile(join(target, '.ui-revision'), 'utf8').catch(() => '')
  const hash = createHash('sha256')
  for (const name of ['main.cjs', 'preload.cjs', 'protocol.cjs', 'index.html', 'renderer.js', 'style.css', 'package.json']) {
    const contents = await readFile(join(directory, name))
    hash.update(contents)
    await cp(join(directory, name), join(target, name))
  }
  const runtimeRecord = join(directory, `.runtime-${randomUUID()}.tmp`)
  await writeFile(runtimeRecord, JSON.stringify({ executable: join(target, runtimeName, 'electron.exe'), application: windowsDirectory }))
  await rename(runtimeRecord, join(directory, '.runtime.json'))
  const revision = hash.digest('hex')
  await writeFile(join(target, '.ui-revision'), revision)
  if (previousRevision !== revision) {
    const root = join(target, 'bridge')
    for (const connection of await readdir(root).catch(() => [])) {
      if (!/^[a-f0-9-]{36}$/.test(connection)) continue
      const mailbox = join(root, connection)
      const lease = await stat(join(mailbox, 'lease')).catch(() => null)
      if (!lease || Date.now() - lease.mtimeMs > 20000) continue
      const temporary = join(mailbox, `command-${randomUUID()}.tmp`)
      try {
        await writeFile(temporary, JSON.stringify({ type: 'shutdown' }))
        await rename(temporary, temporary.replace(/\.tmp$/, '.json'))
      } catch (error) { if (error.code !== 'ENOENT') throw error }
    }
  }
  console.log('Staged Windows companion in LocalAppData/DSHNotifyInteractive/companion')
}

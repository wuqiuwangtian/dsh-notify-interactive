import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 12)) throw new Error('Companion installer requires Node.js >=22.12 (the DSH plugin still supports Node.js 20).')
const directory = fileURLToPath(new URL('../companion', import.meta.url))
const windows = process.platform === 'win32' || existsSync('/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe')
const env = { ...process.env, ELECTRON_INSTALL_PLATFORM: windows ? 'win32' : process.platform, ELECTRON_INSTALL_ARCH: process.arch }
for (const [command, args] of [
  [process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--prefix', directory, '--include=dev', '--ignore-scripts', '--no-audit', '--no-fund']],
  [process.execPath, [fileURLToPath(new URL('../companion/node_modules/electron/install.js', import.meta.url))]],
]) {
  const result = spawnSync(command, args, { env, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd') })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
await import('./stage-companion.mjs')

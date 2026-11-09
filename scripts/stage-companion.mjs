import { cp, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join, win32 } from 'node:path'

const directory = fileURLToPath(new URL('../companion', import.meta.url))
const powershell = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
if (process.platform !== 'win32' && existsSync(powershell)) {
  const localAppData = execFileSync(powershell, ['-NoProfile', '-NonInteractive', '-Command', '[Environment]::GetFolderPath("LocalApplicationData")'], { encoding: 'utf8' }).trim()
  const windowsDirectory = win32.join(localAppData, 'DSHNotifyInteractive', 'companion')
  const target = execFileSync('wslpath', ['-u', windowsDirectory], { encoding: 'utf8' }).trim()
  await mkdir(target, { recursive: true })
  await cp(join(directory, 'node_modules/electron/dist'), join(target, 'runtime'), { recursive: true })
  for (const name of ['main.cjs', 'preload.cjs', 'protocol.cjs', 'index.html', 'renderer.js', 'style.css', 'package.json']) {
    await cp(join(directory, name), join(target, name))
  }
  await writeFile(join(directory, '.runtime.json'), JSON.stringify({ executable: join(target, 'runtime/electron.exe'), application: windowsDirectory }))
  console.log('Staged Windows companion in LocalAppData/DSHNotifyInteractive/companion')
}

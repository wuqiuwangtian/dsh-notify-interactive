import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
if (args.some(arg => !['--dry-run', '--legacy-only'].includes(arg))) throw Error('usage: node scripts/uninstall-windows.mjs [--dry-run] [--legacy-only]')
const shell = process.platform === 'win32' ? join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe')
  : '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
const script = readFileSync(new URL('../lib/uninstall-toast.ps1', import.meta.url), 'utf8')
const command = "$ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; & {\n" + script + '\n}' + (args.includes('--dry-run') ? ' -WhatIf' : '') + (args.includes('--legacy-only') ? ' -LegacyOnly' : '')
execFileSync(shell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')],
  { stdio: 'inherit', windowsHide: true })

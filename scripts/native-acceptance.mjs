// Optional development harness. It never reads the user's DSH profile or provider credentials.
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isIP } from 'node:net'
import { removeProfileHistory } from '../src/host/windows-toast.js'
import { createPreferences } from '../src/host/preferences.js'

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log('pnpm native:acceptance [--host <local-IP>] [--port <port>] [--timed] [--bundle <installed-package-directory>]\nUses the native transport and starts with sound off. Creates a temporary home, silent settings and a local no-network adapter; Ctrl+C cleans up. Optional DSH_NOTIFY_DSH_BIN selects the launcher.')
  process.exit(0)
}
const value = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
const port = Number(value('--port') ?? 0)
if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('invalid-port')
const address = value('--host')
if (address && (!isIP(address) || address === '0.0.0.0' || address === '::')) throw Error('invalid-listen-address')
const binary = realpathSync(process.env.DSH_NOTIFY_DSH_BIN ?? execFileSync('which', ['dsh'], { encoding: 'utf8' }).trim())
const installation = resolve(dirname(binary), '..'), require = createRequire(join(installation, 'package.json'))
const repo = resolve(value('--bundle') ?? fileURLToPath(new URL('..', import.meta.url)))
const root = await mkdtemp(join(tmpdir(), 'dsh-notify-native-'))
const profile = join(root, 'profiles/web')
let child
try {
  const fixture = join(root, 'fixture')
  await Promise.all([mkdir(join(profile, 'node_modules'), { recursive: true }), mkdir(fixture), mkdir(join(root, 'workspace'))])
  await writeFile(join(profile, 'package.json'), JSON.stringify({ name: 'notify-native-profile', private: true,
    dependencies: { 'dsh-notify-interactive': `link:${repo}`, 'notify-native-fixture': `link:${fixture}` },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-notify-interactive', 'notify-native-fixture'] } } }))
  let patch = '[]\n'
  if (args.includes('--timed')) {
    const preset = join(dirname(require.resolve('@deepseek-ai/dsh-web-app/package.json')), 'presets/standard.patch.yml')
    patch = (await readFile(preset, 'utf8')).split('\n').slice(1).map(line => line.startsWith('    ') ? line.slice(4) : line).join('\n')
    let matched = false
    patch = patch.replace(/(- id: tool-ask-user\n(\s+)name: [^\n]+\n)/, (_all, row, indent) => {
      matched = true
      return `${row}${indent}config:\n${indent}  mode: timed\n${indent}  timeout: 1\n`
    })
    if (!matched) throw Error('installed-standard-preset-is-incompatible')
  }
  await writeFile(join(profile, 'cordis.patch.yml'), patch)
  await createPreferences(join(profile, 'notify-interactive.settings.json')).update(0, { sound: { enabled: false } })
  await writeFile(join(fixture, 'package.json'), JSON.stringify({ name: 'notify-native-fixture', type: 'module', main: 'index.mjs', dsh: { bundle: { patch: './cordis.patch.yml' } } }))
  await writeFile(join(fixture, 'cordis.patch.yml'), '- insert:\n    - id: notify-native-fixture\n      name: notify-native-fixture\n')
  await writeFile(join(fixture, 'index.mjs'), `import { LlmAdapter } from ${JSON.stringify(pathToFileURL(require.resolve('@deepseek-ai/dsh-llm')).href)}\nimport { createNativeAdapter } from ${JSON.stringify(new URL('./fixtures/native-adapter.mjs', import.meta.url).href)}\nexport const inject=['llm','agents','approval']; export function apply(ctx){ctx.effect(()=>ctx.llm.registerAdapter(['notify-fixture'],createNativeAdapter(LlmAdapter,ctx)))}\n`)
  await symlink(repo, join(profile, 'node_modules/dsh-notify-interactive'))
  await symlink(fixture, join(profile, 'node_modules/notify-native-fixture'))
  const env = Object.fromEntries(['PATH', 'HOME', 'SHELL', 'LANG', 'TERM', 'WSL_INTEROP', 'WSL_DISTRO_NAME', 'USER', 'LOGNAME', 'TMPDIR', 'XDG_RUNTIME_DIR'].filter(key => process.env[key]).map(key => [key, process.env[key]]))
  console.log(`Isolated DSH home: ${root}\nTest workspace: ${join(root, 'workspace')}\nSelect notify-fixture approval/simple-question/question/plan/completion. For plan, use /plan on. Use another conversation to test desktop delivery. ${args.includes('--timed') ? 'Questions continue after one second.' : 'Questions block until answered.'}`)
  let restartRequested = false
  let stopping = false
  const stop = () => { stopping = true; child?.kill('SIGTERM') }
  const restart = () => { restartRequested = true; child?.kill('SIGTERM') }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  process.on('SIGHUP', restart)
  try {
    do {
      restartRequested = false
      child = spawn(process.execPath, [binary, '--profile', 'web', '--no-open', '--port', String(port), ...(address ? ['--host', address] : [])],
        { cwd: root, env: { ...env, DSH_HOME: root }, stdio: 'inherit' })
      process.exitCode = await new Promise((done, reject) => { child.once('error', reject); child.once('exit', code => done(code ?? 0)) })
    } while (restartRequested && !stopping)
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
    process.off('SIGHUP', restart)
  }
} finally {
  if (child) {
    await removeProfileHistory(profile).catch(() => console.warn('Unable to remove the temporary notification group.'))
  }
  if (!child || child.exitCode !== null || child.signalCode !== null) await rm(root, { recursive: true, force: true })
}

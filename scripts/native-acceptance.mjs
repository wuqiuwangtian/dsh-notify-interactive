// Optional development harness. It never reads the user's DSH profile or provider credentials.
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isIP } from 'node:net'
import { removePreviewHistory } from './windows/completion-toast.mjs'
import { createPreferences } from '../src/host/preferences.js'

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log('pnpm native:acceptance [--host <local-IP>] [--port <port>] [--timed] [--windows-toast] [--desktop-debug-port <port>]\nWindows toast preview requires --host and a fixed --port, uses silent native completion notifications and ignores other events. Creates a temporary home, silent settings and a local no-network adapter; Ctrl+C cleans up. Optional DSH_NOTIFY_DSH_BIN selects the launcher.')
  process.exit(0)
}
const value = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
const port = Number(value('--port') ?? 0), debugPort = Number(value('--desktop-debug-port') ?? 0)
if (![port, debugPort].every(n => Number.isInteger(n) && n >= 0 && n <= 65535)) throw Error('invalid-port')
const windowsToast = args.includes('--windows-toast')
const address = value('--host')
if (windowsToast && (!port || isIP(address ?? '') !== 4 || address === '0.0.0.0' || debugPort)) {
  throw Error('windows-toast-requires-reachable-IPv4-fixed-port-and-no-desktop-debug')
}
const binary = realpathSync(process.env.DSH_NOTIFY_DSH_BIN ?? execFileSync('which', ['dsh'], { encoding: 'utf8' }).trim())
const installation = resolve(dirname(binary), '..'), require = createRequire(join(installation, 'package.json'))
const repo = fileURLToPath(new URL('..', import.meta.url))
const root = await mkdtemp(join(tmpdir(), 'dsh-notify-native-'))
const profile = join(root, 'profiles/web')
let child
try {
  const fixture = join(root, 'fixture'), wrapper = join(root, 'notify-wrapper')
  await Promise.all([mkdir(join(profile, 'node_modules'), { recursive: true }), mkdir(fixture), mkdir(wrapper), mkdir(join(root, 'workspace'))])
  await writeFile(join(profile, 'package.json'), JSON.stringify({ name: 'notify-native-profile', private: true,
    dependencies: { 'dsh-notify-interactive': `link:${wrapper}`, 'notify-native-fixture': `link:${fixture}` },
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
  const manifest = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'))
  manifest.main = './host.mjs'; manifest.exports['.'] = './host.mjs'
  await writeFile(join(wrapper, 'package.json'), JSON.stringify(manifest))
  for (const name of ['lib', 'cordis.patch.yml', 'locale', 'icon.svg']) await symlink(join(repo, name), join(wrapper, name))
  const hostUrl = new URL('../lib/index.js', import.meta.url).href
  let host = `export {apply} from ${JSON.stringify(hostUrl)}\n`
  if (debugPort) host = `import{applyHost}from ${JSON.stringify(hostUrl)}; import{createCompanion,resolveCompanionLaunch}from ${JSON.stringify(new URL('../src/host/companion.js', import.meta.url).href)};export function apply(ctx){let submit;const companion=createCompanion({launch(){const c=resolveCompanionLaunch();return {...c,args:[...c.args,'--remote-debugging-port=${debugPort}','--remote-debugging-address=127.0.0.1']}},onEvent(e){if(e.type==='interaction')void submit(e).then(r=>companion.interactionResult(e.id,e.actionId,r.status))}});companion.onInteraction=handler=>{submit=handler};applyHost(ctx,{companion})}\n`
  if (windowsToast) {
    const origin = new URL(`http://${address}:${port}`).origin
    const adapter = new URL('./windows/completion-toast.mjs', import.meta.url).href
    host = `import {applyHost} from ${JSON.stringify(hostUrl)}
import {createToastDelivery} from ${JSON.stringify(adapter)}
export function apply(ctx) {
  applyHost(ctx, { deliver: createToastDelivery(${JSON.stringify(origin)}, ${JSON.stringify(profile)}),
    companion: { dispose() {} }, available: false, legacy: () => false })
}
`
  }
  await writeFile(join(wrapper, 'host.mjs'), host)
  await symlink(wrapper, join(profile, 'node_modules/dsh-notify-interactive'))
  await symlink(fixture, join(profile, 'node_modules/notify-native-fixture'))
  const env = Object.fromEntries(['PATH', 'HOME', 'SHELL', 'LANG', 'TERM', 'WSL_INTEROP', 'WSL_DISTRO_NAME', 'USER', 'LOGNAME', 'TMPDIR', 'XDG_RUNTIME_DIR'].filter(key => process.env[key]).map(key => [key, process.env[key]]))
  console.log(`Isolated DSH home: ${root}\nTest workspace: ${join(root, 'workspace')}\nSelect notify-fixture approval/question/plan/completion. For plan, use /plan on. Use another conversation to test desktop delivery. ${args.includes('--timed') ? 'Questions continue after one second.' : 'Questions block until answered.'}`)
  child = spawn(process.execPath, [binary, '--profile', 'web', '--no-open', '--port', String(port), ...(value('--host') ? ['--host', value('--host')] : [])], { cwd: root, env: { ...env, DSH_HOME: root }, stdio: 'inherit' })
  const stop = () => child.kill('SIGTERM')
  process.on('SIGINT', stop); process.on('SIGTERM', stop)
  process.exitCode = await new Promise((done, reject) => { child.once('error', reject); child.once('exit', code => done(code ?? 0)) })
  process.off('SIGINT', stop); process.off('SIGTERM', stop)
} finally {
  if (windowsToast && child) {
    await removePreviewHistory(profile).catch(() => console.warn('Unable to remove the temporary notification group.'))
  }
  if (!child || child.exitCode !== null || child.signalCode !== null) await rm(root, { recursive: true, force: true })
}

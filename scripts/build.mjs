import { build } from 'esbuild'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const libDir = resolve(root, 'lib')

await mkdir(libDir, { recursive: true })

const result = await build({
  entryPoints: [resolve(root, 'src/client/index.jsx')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  sourcemap: false,
  legalComments: 'none',
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
  ],
})

const bundled = result.outputFiles[0].text
const client = `window.__ModuleLoader__.load({
  id: 'dsh-notify-interactive',
  factory(require) {
    const module = { exports: {} };
    (function (module, exports, require) {
${bundled}
    })(module, module.exports, require);
    return module.exports;
  },
});
`
if (!client.startsWith('window.__ModuleLoader__.load')) {
  throw new Error('client bundle wrapper is missing')
}
await writeFile(resolve(libDir, 'client.js'), client, 'utf8')
await copyFile(resolve(root, 'src/host/index.js'), resolve(libDir, 'index.js'))
await copyFile(resolve(root, 'src/host/logic.js'), resolve(libDir, 'logic.js'))

const written = await readFile(resolve(libDir, 'client.js'), 'utf8')
console.log(`built lib/client.js (${written.length} bytes) and lib/index.js`)

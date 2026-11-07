import { build } from 'esbuild'
import { rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outfile = resolve(root, 'node_modules/.dni-render-smoke.mjs')

await build({
  entryPoints: [resolve(root, 'tests/render-entry.jsx')],
  bundle: true,
  outfile,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  jsx: 'automatic',
  logLevel: 'silent',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/server'],
})

try {
  await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`)
} finally {
  await rm(outfile, { force: true })
}

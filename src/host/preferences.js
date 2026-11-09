import { readFile, mkdir, writeFile, rename } from 'node:fs/promises'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createDefaultSettings, normalizeSettings, mergeSettings } from '../state/settings.js'

/** Revisioned profile preferences; disk commit happens before publication. */
export function createPreferences(file) {
  let state = { revision: 0, initialized: false, settings: createDefaultSettings() }
  let serial = Promise.resolve()
  const ready = (async () => {
    if (!file) return
    try {
      const saved = JSON.parse(await readFile(file, 'utf8'))
      if (!Number.isSafeInteger(saved.revision) || saved.revision < 1) throw Error('invalid-preferences')
      state = { revision: saved.revision, initialized: true, settings: normalizeSettings(saved.settings) }
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('preferences-unreadable')
    }
  })()
  // Callers still receive the rejection; avoid an unhandled rejection before first use.
  ready.catch(() => {})
  return {
    current: () => structuredClone(state.settings),
    async snapshot() { await ready; return structuredClone(state) },
    update(revision, patch, initial) {
      const task = serial.then(async () => {
        await ready
        if (revision !== state.revision) return { conflict: true, ...structuredClone(state) }
        const next = { revision: state.revision + 1, initialized: true, settings: !state.initialized && initial ? normalizeSettings(initial) : mergeSettings(state.settings, patch) }
        if (file) {
          await mkdir(dirname(file), { recursive: true, mode: 0o700 })
          const temporary = `${file}.${randomUUID()}.tmp`
          await writeFile(temporary, JSON.stringify(next), { mode: 0o600 })
          await rename(temporary, file)
        }
        state = next
        return structuredClone(state)
      })
      serial = task.catch(() => {})
      return task
    },
  }
}

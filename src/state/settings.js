/**
 * Persistent notification preferences.
 *
 * The plugin never writes the profile's cordis patch: settings live in the
 * browser (localStorage) because the web surface is browser-owned. A corrupt
 * or unavailable store falls back to defaults instead of failing the plugin.
 */

export const SETTINGS_KEY = 'dsh.notify-interactive.settings.v2'
export const SOUND_PRESET_IDS = Object.freeze(['chime', 'pulse', 'complete', 'soft', 'alert', 'none'])
export const SCENARIO_KEYS = Object.freeze(['approval', 'question', 'planReview', 'completion'])

const DEFAULT_PRESET = 'chime'

/** Full default settings. Callers receive a fresh object. */
export function createDefaultSettings() {
  return {
    version: 2,
    enabled: true,
    sound: {
      enabled: true,
      preset: DEFAULT_PRESET,
      volume: 0.7,
    },
    // Phase 1 keeps every scenario on. The data model is ready for the
    // per-scenario settings UI in phase 2.
    scenarios: {
      approval: scenarioDefaults(),
      question: scenarioDefaults(),
      planReview: scenarioDefaults(),
      completion: scenarioDefaults(),
    },
  }
}

function scenarioDefaults() {
  return { sound: true, notify: true }
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function bool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

function numberIn(value, fallback, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function presetOf(value) {
  return SOUND_PRESET_IDS.includes(value) ? value : DEFAULT_PRESET
}

function scenarioOf(raw) {
  const value = isObject(raw) ? raw : {}
  return {
    sound: bool(value.sound, true),
    notify: bool(value.notify, true),
  }
}

/**
 * Normalize one settings value.
 * Unknown keys are dropped; every branch is rebuilt from defaults so a
 * partially persisted object cannot leave `undefined` fields behind.
 * @param {unknown} raw value read from storage or supplied by a caller.
 * @returns normalized settings.
 */
export function normalizeSettings(raw) {
  const value = isObject(raw) ? raw : {}
  const sound = isObject(value.sound) ? value.sound : {}
  const scenarios = isObject(value.scenarios) ? value.scenarios : {}

  return {
    version: 2,
    enabled: bool(value.enabled, true),
    sound: {
      enabled: bool(sound.enabled, true),
      preset: presetOf(sound.preset),
      volume: numberIn(sound.volume, 0.7, 0, 1),
    },
    scenarios: {
      approval: scenarioOf(scenarios.approval),
      question: scenarioOf(scenarios.question),
      planReview: scenarioOf(scenarios.planReview),
      completion: scenarioOf(scenarios.completion),
    },
  }
}

/** Merge a partial patch over the current settings. */
export function mergeSettings(current, patch) {
  const base = normalizeSettings(current)
  const next = isObject(patch) ? patch : {}
  const scenarios = { ...base.scenarios }
  if (isObject(next.scenarios)) {
    for (const key of SCENARIO_KEYS) {
      if (isObject(next.scenarios[key])) {
        scenarios[key] = { ...base.scenarios[key], ...next.scenarios[key] }
      }
    }
  }
  return normalizeSettings({
    ...base,
    ...next,
    sound: { ...base.sound, ...(isObject(next.sound) ? next.sound : {}) },
    scenarios,
  })
}

/** Create the observable settings store. */
export function createSettingsStore(storage) {
  const target = storage ?? globalThis.localStorage
  const listeners = new Set()
  let storageError = null
  let current

  try {
    const text = target?.getItem(SETTINGS_KEY)
    current = text === null || text === undefined
      ? createDefaultSettings()
      : normalizeSettings(JSON.parse(text))
  } catch {
    current = createDefaultSettings()
    storageError = 'read'
  }

  const emit = () => {
    for (const listener of listeners) {
      try {
        listener()
      } catch {
        // A broken listener must not keep the others from updating.
      }
    }
  }

  const persist = () => {
    try {
      target?.setItem(SETTINGS_KEY, JSON.stringify(current))
      storageError = null
    } catch {
      storageError = 'write'
    }
  }

  return {
    getSnapshot: () => current,
    getStatus: () => ({ storageAvailable: Boolean(target), storageError }),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update(patch) {
      current = mergeSettings(current, patch)
      persist()
      emit()
      return current
    },
    replace(next) {
      current = normalizeSettings(next)
      persist()
      emit()
      return current
    },
    reset() {
      current = createDefaultSettings()
      persist()
      emit()
      return current
    },
  }
}

/**
 * Persistent notification preferences.
 *
 * The plugin never writes the profile's cordis patch: settings live in the
 * browser (localStorage) because every notification surface is browser-owned.
 * A corrupt or unavailable store falls back to defaults instead of failing the
 * plugin.
 */

export const SETTINGS_KEY = 'dsh.notify-interactive.settings.v1'
export const SOUND_PRESET_IDS = Object.freeze(['chime', 'pulse', 'complete', 'soft', 'alert', 'none'])
export const SCENARIO_KEYS = Object.freeze(['approval', 'question', 'planReview', 'completion'])

const DEFAULT_PRESET = 'chime'
const MAX_VOLUME = 1
const MIN_VOLUME = 0
const MAX_AUTO_DISMISS_MS = 60_000
const MIN_AUTO_DISMISS_MS = 0
const MIN_CARDS = 1
const MAX_CARDS = 5

/** Full default settings. Callers receive a fresh object from {@link createDefaultSettings}. */
export function createDefaultSettings() {
  return {
    version: 1,
    enabled: true,
    sound: {
      enabled: true,
      preset: DEFAULT_PRESET,
      volume: 0.7,
    },
    popup: {
      enabled: true,
      fallbackInPage: true,
    },
    system: {
      enabled: true,
    },
    behavior: {
      suppressWhenFocused: true,
      includeSubagents: false,
      completionAutoDismissMs: 8000,
      maxVisibleCards: 3,
    },
    // Phase 1 does not expose this in the settings UI, but the engine reads it
    // from day one so phase 2 only has to add the rows.
    scenarios: {
      approval: scenarioDefaults(),
      question: scenarioDefaults(),
      planReview: scenarioDefaults(),
      completion: scenarioDefaults(),
    },
  }
}

function scenarioDefaults() {
  return { sound: true, popup: true, system: true }
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
    popup: bool(value.popup, true),
    system: bool(value.system, true),
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
  const popup = isObject(value.popup) ? value.popup : {}
  const system = isObject(value.system) ? value.system : {}
  const behavior = isObject(value.behavior) ? value.behavior : {}
  const scenarios = isObject(value.scenarios) ? value.scenarios : {}

  return {
    version: 1,
    enabled: bool(value.enabled, true),
    sound: {
      enabled: bool(sound.enabled, true),
      preset: presetOf(sound.preset),
      volume: numberIn(sound.volume, 0.7, MIN_VOLUME, MAX_VOLUME),
    },
    popup: {
      enabled: bool(popup.enabled, true),
      fallbackInPage: bool(popup.fallbackInPage, true),
    },
    system: {
      enabled: bool(system.enabled, true),
    },
    behavior: {
      suppressWhenFocused: bool(behavior.suppressWhenFocused, true),
      includeSubagents: bool(behavior.includeSubagents, false),
      completionAutoDismissMs: numberIn(
        behavior.completionAutoDismissMs,
        8000,
        MIN_AUTO_DISMISS_MS,
        MAX_AUTO_DISMISS_MS,
      ),
      maxVisibleCards: numberIn(
        behavior.maxVisibleCards,
        3,
        MIN_CARDS,
        MAX_CARDS,
      ),
    },
    scenarios: {
      approval: scenarioOf(scenarios.approval),
      question: scenarioOf(scenarios.question),
      planReview: scenarioOf(scenarios.planReview),
      completion: scenarioOf(scenarios.completion),
    },
  }
}

/**
 * Merge a partial patch over the current settings.
 * Normalization is applied after the merge, so every caller can pass a tiny
 * patch (for example `{ sound: { enabled: false } }`).
 * @param {object} current current normalized settings.
 * @param {object} patch partial settings.
 * @returns normalized settings.
 */
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
    popup: { ...base.popup, ...(isObject(next.popup) ? next.popup : {}) },
    system: { ...base.system, ...(isObject(next.system) ? next.system : {}) },
    behavior: { ...base.behavior, ...(isObject(next.behavior) ? next.behavior : {}) },
    scenarios,
  })
}

/**
 * Create the observable settings store.
 * @param {Storage | undefined} storage localStorage-compatible storage; tests pass a fake.
 * @returns settings store.
 */
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

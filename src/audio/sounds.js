/**
 * Synthesized notification sounds.
 *
 * Web Audio is the primary path. A generated WAV data URL is the fallback for
 * environments where the AudioContext cannot resume (autoplay policy, WebView
 * audio restrictions, or a missing AudioContext). No audio files are fetched.
 */

import { renderPresetToDataUrl } from './wav.js'

/** Built-in presets. `none` is intentionally silent. */
export const SOUND_PRESETS = Object.freeze([
  {
    id: 'chime',
    notes: [
      { freq: 659.25, start: 0, duration: 0.18, gain: 0.35, type: 'sine' },
      { freq: 880, start: 0.12, duration: 0.36, gain: 0.3, type: 'sine' },
    ],
  },
  {
    id: 'pulse',
    notes: [
      { freq: 520, start: 0, duration: 0.08, gain: 0.28, type: 'triangle' },
      { freq: 660, start: 0.1, duration: 0.08, gain: 0.26, type: 'triangle' },
    ],
  },
  {
    id: 'complete',
    notes: [
      { freq: 523.25, start: 0, duration: 0.14, gain: 0.28, type: 'sine' },
      { freq: 659.25, start: 0.1, duration: 0.14, gain: 0.28, type: 'sine' },
      { freq: 783.99, start: 0.2, duration: 0.3, gain: 0.3, type: 'sine' },
    ],
  },
  {
    id: 'soft',
    notes: [
      { freq: 440, start: 0, duration: 0.55, gain: 0.18, type: 'sine' },
    ],
  },
  {
    id: 'alert',
    notes: [
      { freq: 880, start: 0, duration: 0.1, gain: 0.3, type: 'square' },
      { freq: 880, start: 0.2, duration: 0.1, gain: 0.3, type: 'square' },
    ],
  },
  { id: 'none', notes: [] },
])

const THROTTLE_MS = 300
const wavCache = new Map()

/** Clamp a user volume to the supported 0–1 range. */
export function clampVolume(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.7
  return Math.min(1, Math.max(0, value))
}

/** Look up one preset by id. */
export function getPreset(id) {
  return SOUND_PRESETS.find((preset) => preset.id === id) ?? SOUND_PRESETS[0]
}

/**
 * Create the sound player.
 * @param {{ audioContextFactory?: () => AudioContext | null, now?: () => number }} [options]
 * @returns player handle; every method is safe to call when audio is unavailable.
 */
export function createSoundPlayer(options = {}) {
  const audioContextFactory = options.audioContextFactory
  const now = options.now ?? (() => Date.now())
  let audio = null
  let lastPlayedAt = 0
  const activeElements = new Set()

  function ensureContext() {
    if (audio !== null) {
      if (audio.state === 'suspended') {
        try {
          audio.resume?.()
        } catch {
          // The next user gesture or the WAV fallback handles it.
        }
      }
      return audio
    }
    const Ctor = audioContextFactory
      ?? globalThis.AudioContext
      ?? globalThis.webkitAudioContext
    if (typeof Ctor !== 'function') return null
    try {
      audio = Ctor()
    } catch {
      audio = null
    }
    return audio
  }

  function schedule(context, preset, level) {
    const startAt = context.currentTime + 0.01
    for (const note of preset.notes) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = note.type
      oscillator.frequency.setValueAtTime(note.freq, startAt + note.start)
      const peak = Math.max(0.0001, level * note.gain)
      gain.gain.setValueAtTime(0.0001, startAt + note.start)
      gain.gain.exponentialRampToValueAtTime(peak, startAt + note.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.start + note.duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startAt + note.start)
      oscillator.stop(startAt + note.start + note.duration + 0.03)
    }
  }

  /**
   * Start an <audio> element synchronously so the call stays inside the user
   * activation window; the returned promise settles after playback starts.
   * @returns {Promise<boolean> | null} null when no audio element can be used.
   */
  function startAudioElement(preset, volume) {
    if (typeof globalThis.Audio !== 'function') return null
    let url = wavCache.get(preset.id)
    if (url === undefined) {
      url = renderPresetToDataUrl(preset)
      wavCache.set(preset.id, url)
    }
    if (url === '') return null
    try {
      const element = new globalThis.Audio(url)
      element.volume = clampVolume(volume)
      const cleanup = () => activeElements.delete(element)
      element.addEventListener?.('ended', cleanup, { once: true })
      element.addEventListener?.('error', cleanup, { once: true })
      activeElements.add(element)
      const started = element.play()
      if (started !== undefined && typeof started.then === 'function') {
        return started.then(() => true).catch(() => {
          cleanup()
          return false
        })
      }
      return Promise.resolve(true)
    } catch {
      return Promise.resolve(false)
    }
  }

  async function playViaAudioElement(preset, volume) {
    const started = startAudioElement(preset, volume)
    return started === null ? false : started
  }

  function play(presetId, volume) {
    const preset = getPreset(presetId)
    if (preset.notes.length === 0) return false
    const timestamp = now()
    if (timestamp - lastPlayedAt < THROTTLE_MS) return false
    lastPlayedAt = timestamp
    const level = clampVolume(volume)
    const context = ensureContext()
    if (context !== null && context !== undefined && context.state === 'running') {
      schedule(context, preset, level)
      return true
    }
    // Suspended contexts are the most common autoplay failure. Starting the
    // generated WAV element synchronously (inside a user gesture) is the most
    // reliable fallback, and it avoids scheduling Web Audio twice.
    const elementAttempt = startAudioElement(preset, level)
    if (elementAttempt !== null) {
      void elementAttempt
      return true
    }
    if (context !== null && context !== undefined) {
      try {
        const resumed = context.resume?.()
        if (resumed !== undefined && typeof resumed.then === 'function') {
          resumed.then(() => {
            if (context.state === 'running') schedule(context, preset, level)
          }).catch(() => {})
        } else {
          schedule(context, preset, level)
        }
        return true
      } catch {
        // No playable path remains.
      }
    }
    return false
  }

  /**
   * Preview one preset and report the path that was used.
   * @returns {'played' | 'fallback' | 'silent' | 'blocked' | 'unsupported'}
   */
  async function preview(presetId, volume) {
    const preset = getPreset(presetId)
    if (preset.notes.length === 0) return 'silent'
    const level = clampVolume(volume)
    const context = ensureContext()
    if (context !== null && context !== undefined && context.state === 'running') {
      schedule(context, preset, level)
      return 'played'
    }
    // Start the WAV element before any await so the click's activation is
    // still valid. If it fails, try one last AudioContext resume.
    const elementAttempt = startAudioElement(preset, level)
    if (elementAttempt !== null) {
      const played = await elementAttempt
      if (played) return 'fallback'
    }
    if (context !== null && context !== undefined) {
      try {
        await context.resume?.()
        if (context.state === 'running') {
          schedule(context, preset, level)
          return 'played'
        }
      } catch {
        // No playable path remains.
      }
    }
    if (typeof globalThis.Audio !== 'function' && (context === null || context === undefined)) {
      return 'unsupported'
    }
    return 'blocked'
  }

  return {
    presets: SOUND_PRESETS,
    play,
    preview,
    unlock: ensureContext,
    isReady: () => audio !== null && audio.state === 'running',
  }
}

/**
 * Synthesized notification sounds.
 *
 * No audio files are shipped: every preset is a short Web Audio envelope, so
 * the plugin has no asset licensing surface and works offline.
 */

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
 * @returns player handle; every method is safe to call when Web Audio is unavailable.
 */
export function createSoundPlayer(options = {}) {
  const audioContextFactory = options.audioContextFactory
  const now = options.now ?? (() => Date.now())
  let audio = null
  let lastPlayedAt = 0

  function ensureContext() {
    if (audio !== null) {
      if (audio.state === 'suspended') {
        try {
          audio.resume?.()
        } catch {
          // A rejected resume is handled by the next user gesture.
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

  function play(presetId, volume) {
    const preset = getPreset(presetId)
    if (preset.notes.length === 0) return false
    const timestamp = now()
    if (timestamp - lastPlayedAt < THROTTLE_MS) return false
    lastPlayedAt = timestamp
    const context = ensureContext()
    if (context === null || context === undefined) return false
    if (context.state === 'suspended') {
      try {
        context.resume?.()
      } catch {
        // Playback still works after the next activation.
      }
    }
    const level = clampVolume(volume)
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
    return true
  }

  return {
    presets: SOUND_PRESETS,
    play,
    preview: play,
    unlock: ensureContext,
    isReady: () => audio !== null && audio.state === 'running',
  }
}

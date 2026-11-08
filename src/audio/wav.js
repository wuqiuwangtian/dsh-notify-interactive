/**
 * Render a built-in preset to a small WAV data URL.
 *
 * This is the fallback path when Web Audio is unavailable or the page's
 * autoplay policy refuses to resume the AudioContext. It is generated locally;
 * no audio file is fetched.
 */

const SAMPLE_RATE = 22050

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index))
  }
}

function bytesToBase64(bytes) {
  if (typeof globalThis.btoa === 'function') {
    let binary = ''
    const chunk = 0x8000
    for (let offset = 0; offset < bytes.length; offset += chunk) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
    }
    return globalThis.btoa(binary)
  }
  if (typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer.from(bytes).toString('base64')
  }
  return ''
}

/**
 * Render one preset to a `data:audio/wav;base64,...` URL.
 * @param {{ id: string, notes: Array<{ freq: number, start: number, duration: number, gain: number }> }} preset
 * @returns {string} a playable WAV data URL, or an empty string for silence.
 */
export function renderPresetToDataUrl(preset) {
  const notes = Array.isArray(preset?.notes) ? preset.notes : []
  if (notes.length === 0) return ''
  const duration = Math.max(...notes.map((note) => note.start + note.duration), 0) + 0.06
  const length = Math.max(1, Math.ceil(duration * SAMPLE_RATE))
  const samples = new Float32Array(length)

  for (const note of notes) {
    const start = Math.round(note.start * SAMPLE_RATE)
    const end = Math.min(length, Math.round((note.start + note.duration) * SAMPLE_RATE))
    for (let index = start; index < end; index += 1) {
      const local = (index - start) / SAMPLE_RATE
      const attack = Math.min(1, local / 0.008)
      const decay = Math.exp((-5 * local) / note.duration)
      samples[index] += Math.sin(2 * Math.PI * note.freq * local) * note.gain * attack * decay
    }
  }

  let peak = 0
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample))
  const normalize = peak > 0 ? 0.92 / peak : 0

  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)
  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + length * 2, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, length * 2, true)
  for (let index = 0; index < length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] * normalize))
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }

  const base64 = bytesToBase64(new Uint8Array(buffer))
  return base64 === '' ? '' : `data:audio/wav;base64,${base64}`
}

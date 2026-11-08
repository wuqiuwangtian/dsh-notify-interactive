import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SOUND_PRESETS,
  clampVolume,
  createSoundPlayer,
  getPreset,
} from '../src/audio/sounds.js'
import { renderPresetToDataUrl } from '../src/audio/wav.js'

function fakeAudioContext() {
  const created = []
  class FakeParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class FakeOscillator {
    constructor() {
      this.frequency = new FakeParam()
      this.type = 'sine'
      created.push(this)
    }
    connect() {}
    start() {}
    stop() {}
  }
  class FakeGain {
    constructor() {
      this.gain = new FakeParam()
    }
    connect() {}
  }
  class FakeContext {
    constructor() {
      this.state = 'running'
      this.currentTime = 0
      this.destination = {}
    }
    createOscillator() {
      return new FakeOscillator()
    }
    createGain() {
      return new FakeGain()
    }
    resume() {}
  }
  return { context: new FakeContext(), created }
}

test('every preset has a unique id and the none preset is silent', () => {
  const ids = SOUND_PRESETS.map((preset) => preset.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(getPreset('none').notes, [])
  assert.equal(getPreset('missing').id, 'chime')
})

test('volume clamps to the supported range', () => {
  assert.equal(clampVolume(-1), 0)
  assert.equal(clampVolume(2), 1)
  assert.equal(clampVolume(0.4), 0.4)
  assert.equal(clampVolume('bad'), 0.7)
})

test('player synthesizes notes, throttles bursts, and ignores silence', () => {
  const fake = fakeAudioContext()
  let nowValue = 1_000
  const player = createSoundPlayer({
    audioContextFactory: () => fake.context,
    now: () => nowValue,
  })
  assert.equal(player.play('none', 0.5), false)
  assert.equal(player.play('chime', 0.5), true)
  assert.equal(fake.created.length, 2)
  assert.equal(player.play('pulse', 0.5), false)
  nowValue += 301
  assert.equal(player.play('pulse', 0.5), true)
  assert.equal(fake.created.length, 4)
})

test('preview reports the playback path', async () => {
  const fake = fakeAudioContext()
  const player = createSoundPlayer({
    audioContextFactory: () => fake.context,
    now: () => 1_000,
  })
  assert.equal(await player.preview('chime', 0.5), 'played')
  assert.equal(await player.preview('none', 0.5), 'silent')
  const unavailable = createSoundPlayer({
    audioContextFactory: () => null,
    now: () => 1_000,
  })
  assert.equal(await unavailable.preview('chime', 0.5), 'unsupported')
})

test('WAV fallback renders a playable data URL', () => {
  const url = renderPresetToDataUrl(getPreset('chime'))
  assert.match(url, /^data:audio\/wav;base64,/)
  assert.ok(url.length > 1000)
  assert.equal(renderPresetToDataUrl(getPreset('none')), '')
})

test('player degrades when Web Audio is unavailable', () => {
  const player = createSoundPlayer({
    audioContextFactory: () => null,
    now: () => 1_000,
  })
  assert.equal(player.play('chime', 0.5), false)
  assert.equal(player.isReady(), false)
})

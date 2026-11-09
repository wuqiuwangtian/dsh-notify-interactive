import { renderPresetToDataUrl } from '../audio/wav.js'
import { SOUND_PRESETS } from '../audio/sounds.js'

export function channelPolicy(settings, kind, attended = false) {
  const scenario = settings.scenarios[kind === 'plan-review' ? 'planReview' : kind] ?? { sound: true, notify: true, preset: 'inherit' }
  const enabled = settings.enabled && !attended
  const preset = scenario.preset === 'inherit' || !scenario.preset ? settings.sound.preset : scenario.preset
  return {
    popup: enabled && settings.popup.enabled && scenario.notify,
    sound: enabled && settings.sound.enabled && scenario.sound && preset !== 'none' && settings.sound.volume > 0,
    preset, volume: settings.sound.volume,
  }
}

/** One coordinator claim encloses every effect, including sound and native fallback. */
export async function deliverNotification({ companion, available, legacy, payload, policy, getPolicy, isCurrent = () => true }) {
  const currentPolicy = () => getPolicy?.() ?? policy
  function prepare() {
    const fresh = currentPolicy()
    if (!isCurrent() || (!fresh.popup && !fresh.sound)) return null
    const preset = SOUND_PRESETS.find(item => item.id === fresh.preset)
    return { ...payload, popup: fresh.popup && !payload.webPopup,
      audio: fresh.sound && preset ? renderPresetToDataUrl(preset) : '', volume: fresh.volume }
  }
  if (!prepare()) return { shown: false, delivery: 'suppressed' }
  if (available) {
    const result = await companion.deliver(prepare(), prepare)
    if (result.reason === 'stale-event' || result.status === 'suppressed') return { shown: false, delivery: 'suppressed' }
    if (['rendered', 'uncertain', 'queued'].includes(result.status)) return { shown: result.status === 'rendered', delivery: result.status }
  }
  const fresh = currentPolicy()
  if (!isCurrent() || (!fresh.popup && !fresh.sound)) return { shown: false, delivery: 'suppressed' }
  const accepted = legacy(payload.title, payload.body, !fresh.sound, payload.url, fresh.popup && !payload.webPopup)
  return { shown: accepted, delivery: accepted ? 'process-started' : 'unavailable' }
}

import { visualAllowed } from '../state/settings.js'

export function channelPolicy(settings, kind, attended = false, windowFocused = attended) {
  const scenario = settings.scenarios[kind === 'plan-review' ? 'planReview' : kind] ?? { sound: true, notify: true, preset: 'inherit' }
  const enabled = settings.enabled && !attended
  const preset = scenario.preset === 'inherit' || !scenario.preset ? settings.sound.preset : scenario.preset
  return {
    popup: settings.enabled && visualAllowed(kind, settings.popup.completionMode, attended, windowFocused) && settings.popup.enabled && scenario.notify,
    sound: enabled && settings.sound.enabled && scenario.sound && preset !== 'none' && settings.sound.volume > 0,
    preset, volume: settings.sound.volume,
  }
}

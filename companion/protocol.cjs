/** The desktop process accepts data, never executable markup or arbitrary IPC. */
function validateDelivery(message) {
  if (message?.type !== 'deliver' || typeof message.id !== 'string' || !message.id || message.id.length > 160) return false
  if (typeof message.title !== 'string' || message.title.length > 200 || typeof message.body !== 'string' || message.body.length > 2000) return false
  if (typeof message.openLabel !== 'string' || message.openLabel.length > 80) return false
  if (message.sticky !== undefined && typeof message.sticky !== 'boolean') return false
  if (message.eventId !== undefined && (typeof message.eventId !== 'string' || message.eventId.length > 2048)) return false
  if (message.sessionTitle !== undefined && (typeof message.sessionTitle !== 'string' || message.sessionTitle.length > 200)) return false
  if (message.closeLabel !== undefined && (typeof message.closeLabel !== 'string' || message.closeLabel.length > 80)) return false
  if (message.interaction != null && !validateInteraction(message.interaction)) return false
  if (!Number.isFinite(message.volume) || message.volume < 0 || message.volume > 1) return false
  if (typeof message.audio !== 'string' || message.audio.length > 200000 || (message.audio !== '' && !/^data:audio\/wav;base64,[A-Za-z0-9+/=]+$/.test(message.audio))) return false
  if (typeof message.url !== 'string' || message.url.length > 4000) return false
  try {
    const url = new URL(message.url)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false
  } catch { return false }
  if (!message.theme || typeof message.theme !== 'object' || Array.isArray(message.theme)) return false
  const entries = Object.entries(message.theme)
  return entries.length <= 100 && entries.every(([name, value]) => /^--(?:dsw|dsh|ds)-[a-zA-Z0-9-]+$/.test(name) && typeof value === 'string' && value.length <= 512 && !/url\s*\(/i.test(value))
}
function validateInteraction(value) {
  if (!value || JSON.stringify(value).length > 52000) return false
  if (!['instanceId', 'eventId', 'token', 'callId'].every(key => typeof value[key] === 'string' && value[key].length <= 2048)) return false
  if (value.kind === 'approval') return typeof value.toolName === 'string' && typeof value.description === 'string'
  return ['question', 'plan-review'].includes(value.kind) && Array.isArray(value.questions) && value.questions.length > 0 && value.questions.length <= 32 &&
    value.questions.every(q => typeof q.id === 'string' && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length <= 64 && q.options.every(o => typeof o.label === 'string'))
}
module.exports = { validateDelivery, validateInteraction }

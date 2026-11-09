/** The desktop process accepts data, never executable markup or arbitrary IPC. */
function validateDelivery(message) {
  if (message?.type !== 'deliver' || typeof message.id !== 'string' || !message.id || message.id.length > 160) return false
  if (typeof message.title !== 'string' || message.title.length > 200 || typeof message.body !== 'string' || message.body.length > 2000) return false
  if (typeof message.openLabel !== 'string' || message.openLabel.length > 80) return false
  if (message.closeLabel !== undefined && (typeof message.closeLabel !== 'string' || message.closeLabel.length > 80)) return false
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
module.exports = { validateDelivery }

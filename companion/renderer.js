/* Completion-only prototype. No DSH code or privileged APIs run in this page. */
const card = document.getElementById('card')
let audio
window.reminder.onMessage(message => {
  for (const [name, value] of Object.entries(message.theme ?? {})) {
    if (/^--(?:dsw|dsh|ds)-[a-zA-Z0-9-]+$/.test(name) && typeof value === 'string' && !/url\s*\(/i.test(value)) {
      document.documentElement.style.setProperty(name, value)
    }
  }
  document.getElementById('title').textContent = message.title
  document.getElementById('body').textContent = message.body
  document.getElementById('open').textContent = message.openLabel
  card.hidden = message.popup === false
  if (message.audio) {
    audio?.pause()
    audio = new Audio(message.audio)
    audio.volume = message.volume
    audio.play().then(() => window.reminder.audioResult(message.id, true), () => window.reminder.audioResult(message.id, false))
  }
  // Reading layout confirms the local card exists, not that the user saw it.
  card.getBoundingClientRect()
  window.reminder.rendered(message.id)
})
document.getElementById('open').onclick = () => window.reminder.openSession()
window.reminder.ready()

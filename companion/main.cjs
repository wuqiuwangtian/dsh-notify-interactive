const { app, BrowserWindow, ipcMain, screen, shell, Menu } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { randomUUID } = require('node:crypto')
const { validateDelivery, validateInteraction, createInteractionState } = require('./protocol.cjs')
const mailbox = process.argv.find(value => value.startsWith('--dsh-notify-mailbox='))?.slice('--dsh-notify-mailbox='.length)
if (!mailbox) app.exit(1)
const send = value => {
  if (!mailbox) return
  const temporary = path.join(mailbox, `event-${randomUUID()}.tmp`)
  try { fs.writeFileSync(temporary, JSON.stringify(value)); fs.renameSync(temporary, temporary.replace(/\.tmp$/, '.json')) } catch { app.quit() }
}
let win
let current
let inputTimer
let closeTimer
let quitting = false
let awaitingRender = false
const seen = new Set()
const revoked = new Set()
const queue = []
const audioOnly = new Set()
const actions = new Map()
const interactionState = createInteractionState()
let focusSequence = 0
function reportFocus(action) {
  focusSequence = Math.max(focusSequence + 1, Date.now())
  if (current?.interaction) send({ ...current.interaction, type: 'interaction', id: current.id, actionId: randomUUID(), action, sequence: focusSequence })
}
const userData = path.join(app.getPath('temp'), `dsh-notify-${randomUUID()}`)
app.setPath('userData', userData)
app.on('quit', () => {
  try { fs.rmSync(userData, { recursive: true, force: true }) } catch { /* Windows may still hold cache files briefly. */ }
  // Remove only this connection's UUID mailbox, never an arbitrary argument path.
  if (mailbox && /^[a-f0-9-]{36}$/.test(path.basename(mailbox)) && ['bridge', 'dsh-notify-bridge'].includes(path.basename(path.dirname(mailbox)))) {
    try { fs.rmSync(mailbox, { recursive: true, force: true }) } catch { /* Host cleanup is a second chance. */ }
  }
})

function pump() {
  if (current || !queue.length) return
  current = queue.shift()
  awaitingRender = true
  win.webContents.send('reminder', current)
}
function hide() {
  reportFocus('blur')
  clearTimeout(closeTimer); win?.hide(); current = undefined; awaitingRender = false; pump()
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({
    width: 360, height: 124, frame: false, thickFrame: false, minHeight: 1, resizable: false, show: false, alwaysOnTop: true, skipTaskbar: true,
    title: 'DSH', minimizable: false, maximizable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' },
  })
  win.setMenu(null)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', event => event.preventDefault())
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  win.on('close', event => { if (!quitting) { event.preventDefault(); hide() } })
  win.on('focus', () => reportFocus('focus'))
  win.on('blur', () => reportFocus('blur'))
  const focusHeartbeat = setInterval(() => { if (win?.isFocused() && current?.interaction) reportFocus('focus') }, 3000)
  app.once('before-quit', () => clearInterval(focusHeartbeat))
  win.webContents.on('render-process-gone', () => { send({ type: 'failed', id: current?.id, reason: 'renderer-exited' }); app.quit() })
  const fromWindow = event => event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame
  ipcMain.on('ready', event => {
    if (!fromWindow(event)) return
    send({ type: 'ready', protocol: 1 })
    inputTimer = setInterval(() => {
      try {
        if (Date.now() - fs.statSync(path.join(mailbox, 'lease')).mtimeMs > 15000) { app.quit(); return }
        for (const name of fs.readdirSync(mailbox).filter(name => /^command-[a-f0-9-]+\.json$/.test(name))) {
          if (awaitingRender) break
          const file = path.join(mailbox, name)
          const contents = fs.readFileSync(file, 'utf8')
          fs.unlinkSync(file)
          if (contents.length > 256000) { send({ type: 'failed', reason: 'message-too-large' }); continue }
          let message = JSON.parse(contents)
          if (message.type === 'shutdown') { app.quit(); return }
          if (message.type === 'interaction-result') {
            const action = actions.get(message.actionId)
            if (action && action.id === message.id) { clearTimeout(action.timer); actions.delete(message.actionId); action.resolve({ status: message.status }) }
            continue
          }
          if (message.type === 'interaction-update' && typeof message.eventId === 'string' && (message.interaction === null || validateInteraction(message.interaction))) {
            const matching = queue.filter(item => item.eventId === message.eventId)
            if (current?.eventId === message.eventId) matching.push(current)
            const floor = Math.max(0, ...matching.map(item => item.interactionRevision ?? 0))
            if (!interactionState.update(message, floor)) continue
            for (const item of matching) { item.interaction = message.interaction; item.interactionRevision = message.interactionRevision }
            if (current?.eventId === message.eventId) {
              current.interaction = message.interaction
              win.webContents.send('reminder', { type: 'interaction-update', id: current.id, interaction: message.interaction })
            }
            continue
          }
          if (message.type === 'silence' && typeof message.eventId === 'string') {
            for (const item of queue) if (item.eventId === message.eventId) item.audio = ''
            win.webContents.send('reminder', { type: 'silence', eventId: message.eventId })
            continue
          }
          if (message.type === 'withdraw' && typeof message.eventId === 'string') {
            revoked.add(message.eventId)
            if (revoked.size > 512) revoked.delete(revoked.values().next().value)
            for (let index = queue.length - 1; index >= 0; index--) if (queue[index].eventId === message.eventId) queue.splice(index, 1)
            if (current?.eventId === message.eventId) hide()
            continue
          }
          if (!validateDelivery(message)) { send({ type: 'failed', id: message?.id, reason: 'invalid-message' }); continue }
          message = interactionState.decorate(message)
          if (revoked.has(message.eventId)) { send({ type: 'failed', id: message.id, reason: 'stale-event' }); continue }
          if (seen.has(message.id)) { send({ type: 'duplicate', id: message.id }); continue }
          seen.add(message.id)
          if (seen.size > 256) seen.delete(seen.values().next().value)
          if (message.popup === false) {
            audioOnly.add(message.id)
            if (audioOnly.size > 256) audioOnly.delete(audioOnly.values().next().value)
            win.webContents.send('reminder', { ...message, audioOnly: true })
            continue
          }
          if (queue.length >= 64) { send({ type: 'failed', id: message.id, reason: 'queue-full' }); continue }
          queue.push(message)
          if (current) send({ type: 'queued', id: message.id })
          else pump()
        }
      } catch { app.quit() }
    }, 100)
  })
  ipcMain.on('rendered', (event, report) => {
    const id = report?.id
    if (!fromWindow(event)) return
    if (audioOnly.has(id)) {
      send({ type: 'rendered', id, visible: win.isVisible(), focused: win.isFocused() })
      return
    }
    if (current?.id !== id) return
    awaitingRender = false
    if (Number.isFinite(report.height)) {
      const width = report.width === 420 ? 420 : 360
      const height = Math.max(96, Math.min(620, report.height))
      const previous = win.getSize()
      if (previous[0] !== width || previous[1] !== height) {
        // Windows keeps fixed-window tracking limits at the previous size.
        // Unlock only while applying the content's dimensions, then restore it.
        win.setResizable(true)
        win.setMinimumSize(1, 1)
        win.setSize(width, height)
        win.setResizable(false)
      }
    }
    if (current.popup !== false) {
      const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const [width, height] = win.getSize()
      const bottomInset = process.platform === 'win32' ? 48 : 20
      win.setPosition(Math.max(area.x, area.x + area.width - width - 20), Math.max(area.y, area.y + area.height - height - bottomInset))
      win.showInactive()
    } else win.hide()
    send({ type: 'rendered', id, visible: win.isVisible(), focused: win.isFocused(), bounds: win.getBounds(), scaleFactor: screen.getDisplayMatching(win.getBounds()).scaleFactor })
    if (!current.sticky) { clearTimeout(closeTimer); closeTimer = setTimeout(hide, 8000) }
  })
  ipcMain.handle('interaction', (event, packet) => {
    if (!fromWindow(event) || current?.id !== packet?.id || !current.interaction || current.interaction.blocked ||
      !['answer', 'focus', 'blur', 'engage', 'take-time'].includes(packet.action) || JSON.stringify(packet).length > 64000) return { status: 'unavailable' }
    const actionId = randomUUID()
    const reminder = current
    return new Promise(resolve => {
      const timer = setTimeout(() => { actions.delete(actionId); resolve({ status: 'uncertain' }) }, 13000)
      actions.set(actionId, { id: reminder.id, resolve, timer })
      send({ ...reminder.interaction, type: 'interaction', id: reminder.id, actionId, action: packet.action, answer: packet.answer })
    })
  })
  ipcMain.on('audio-result', (event, value) => {
    if (fromWindow(event) && seen.has(value?.id)) send({ type: 'audio', id: value.id, played: value.played === true })
  })
  ipcMain.on('open-session', async (event, id) => {
    if (!fromWindow(event) || current?.id !== id) return
    const opened = current
    try { await shell.openExternal(new URL(opened.url).href); if (current === opened) hide() }
    catch { send({ type: 'failed', id: opened.id, reason: 'open-session-failed' }) }
  })
  ipcMain.on('dismiss', (event, id) => { if (fromWindow(event) && current?.id === id) hide() })
  await win.loadFile(path.join(__dirname, 'index.html'))
}).catch(() => { send({ type: 'failed', reason: 'startup-failed' }); app.quit() })
app.on('before-quit', () => { quitting = true; clearTimeout(closeTimer); clearInterval(inputTimer) })

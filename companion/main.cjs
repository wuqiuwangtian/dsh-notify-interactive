const { app, BrowserWindow, ipcMain, screen, shell, Menu } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { randomUUID } = require('node:crypto')
const { validateDelivery } = require('./protocol.cjs')
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
function hide() { clearTimeout(closeTimer); win?.hide(); current = undefined; awaitingRender = false; pump() }

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
          const message = JSON.parse(contents)
          if (message.type === 'shutdown') { app.quit(); return }
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
    if (Number.isFinite(report.height)) win.setSize(360, Math.max(96, Math.min(360, report.height)))
    if (current.popup !== false) {
      const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const [width, height] = win.getSize()
      const bottomInset = process.platform === 'win32' ? 48 : 20
      win.setPosition(Math.max(area.x, area.x + area.width - width - 20), Math.max(area.y, area.y + area.height - height - bottomInset))
      win.showInactive()
    } else win.hide()
    send({ type: 'rendered', id, visible: win.isVisible(), focused: win.isFocused(), bounds: win.getBounds(), scaleFactor: screen.getDisplayMatching(win.getBounds()).scaleFactor })
    if (!current.sticky) closeTimer = setTimeout(hide, 8000)
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

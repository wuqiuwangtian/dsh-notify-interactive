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
const userData = path.join(app.getPath('temp'), `dsh-notify-${randomUUID()}`)
app.setPath('userData', userData)
app.on('quit', () => { try { fs.rmSync(userData, { recursive: true, force: true }) } catch { /* Windows may still hold cache files briefly. */ } })

function hide() { clearTimeout(closeTimer); win?.hide(); current = undefined }

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
          if (!validateDelivery(message)) { send({ type: 'failed', id: message?.id, reason: 'invalid-message' }); continue }
          if (seen.has(message.id)) { send({ type: 'duplicate', id: message.id }); continue }
          seen.add(message.id)
          if (seen.size > 256) seen.delete(seen.values().next().value)
          current = message
          awaitingRender = true
          clearTimeout(closeTimer)
          win.webContents.send('reminder', message)
        }
      } catch { app.quit() }
    }, 100)
  })
  ipcMain.on('rendered', (event, report) => {
    const id = report?.id
    if (!fromWindow(event) || current?.id !== id) return
    awaitingRender = false
    if (Number.isFinite(report.height)) win.setSize(360, Math.max(96, Math.min(360, report.height)))
    if (current.popup !== false) {
      const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const [width, height] = win.getSize()
      win.setPosition(Math.max(area.x, area.x + area.width - width - 20), Math.max(area.y, area.y + area.height - height - 20))
      win.showInactive()
    } else win.hide()
    send({ type: 'rendered', id, visible: win.isVisible(), focused: win.isFocused(), bounds: win.getBounds(), scaleFactor: screen.getDisplayMatching(win.getBounds()).scaleFactor })
    closeTimer = setTimeout(hide, 8000)
  })
  ipcMain.on('audio-result', (event, value) => {
    if (fromWindow(event) && current?.id === value?.id) send({ type: 'audio', id: value.id, played: value.played === true })
  })
  ipcMain.on('open-session', async event => {
    if (!fromWindow(event) || !current) return
    try { await shell.openExternal(new URL(current.url).href); hide() }
    catch { send({ type: 'failed', id: current?.id, reason: 'open-session-failed' }) }
  })
  ipcMain.on('dismiss', event => { if (fromWindow(event)) hide() })
  await win.loadFile(path.join(__dirname, 'index.html'))
}).catch(() => { send({ type: 'failed', reason: 'startup-failed' }); app.quit() })
app.on('before-quit', () => { quitting = true; clearTimeout(closeTimer); clearInterval(inputTimer) })

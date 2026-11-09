const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('reminder', {
  onMessage: callback => ipcRenderer.on('reminder', (_event, message) => callback(message)),
  ready: () => ipcRenderer.send('ready'),
  rendered: (id, height) => ipcRenderer.send('rendered', { id, height }),
  audioResult: (id, played) => ipcRenderer.send('audio-result', { id, played }),
  openSession: () => ipcRenderer.send('open-session'),
  dismiss: () => ipcRenderer.send('dismiss'),
})

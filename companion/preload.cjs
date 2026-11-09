const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('reminder', {
  onMessage: callback => ipcRenderer.on('reminder', (_event, message) => callback(message)),
  ready: () => ipcRenderer.send('ready'),
  rendered: id => ipcRenderer.send('rendered', id),
  audioResult: (id, played) => ipcRenderer.send('audio-result', { id, played }),
  openSession: () => ipcRenderer.send('open-session'),
  dismiss: () => ipcRenderer.send('dismiss'),
})

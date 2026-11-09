const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('reminder', {
  onMessage: callback => ipcRenderer.on('reminder', (_event, message) => callback(message)),
  ready: () => ipcRenderer.send('ready'),
  rendered: (id, height, width) => ipcRenderer.send('rendered', { id, height, width }),
  audioResult: (id, played) => ipcRenderer.send('audio-result', { id, played }),
  openSession: id => ipcRenderer.send('open-session', id),
  dismiss: id => ipcRenderer.send('dismiss', id),
  interact: (id, action, answer) => ipcRenderer.invoke('interaction', { id, action, answer }),
})

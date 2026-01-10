const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Image selection
  selectImages: () => ipcRenderer.invoke('select-images'),

  // Save/Load content
  saveContent: (content) => ipcRenderer.invoke('save-content', content),
  loadContent: () => ipcRenderer.invoke('load-content'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleAlwaysOnTop: (value) => ipcRenderer.send('toggle-always-on-top', value)
});

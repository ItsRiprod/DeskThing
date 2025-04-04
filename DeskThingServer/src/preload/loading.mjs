import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electron', {
  loading: {
    onStatusUpdate: (callback) => {
      ipcRenderer.on('loading-status', (_, message) => {
        callback(message)
      })
    }
  }
})

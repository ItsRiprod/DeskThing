import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    electron: {
      loading: {
        onStatusUpdate: (callback: (message: string) => void) => () => void
      }
    }
  }
}

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electron', {
  loading: {
    onStatusUpdate: (callback) => {
      ipcRenderer.on('loading-status', (_, message) => {
        console.log('[preload]: Received status update:', message)
        callback(message)
      })
    }
  }
})

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectZipFile: (): Promise<{ name: string; path: string } | null> =>
    ipcRenderer.invoke('select-zip-file'),
  runAdbCommand: (command: string): Promise<string[] | null> =>
    ipcRenderer.invoke('run-adb-command', command)
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ...api
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ...electronAPI, ...api }
}

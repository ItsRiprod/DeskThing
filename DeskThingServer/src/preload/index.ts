import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectZipFile: (): Promise<{ name: string; path: string } | null> =>
    ipcRenderer.invoke('select-zip-file'),
  runAdbCommand: (command: string): Promise<string | null> =>
    ipcRenderer.invoke('run-adb-command', command),
  runDeviceCommand: (type: string, command: string): Promise<string | null> =>
    ipcRenderer.invoke('run-device-command', type, command),
  fetchReleases: (url: string): Promise<[]> => ipcRenderer.invoke('fetch-github-releases', url),
  getLogs: (): Promise<string[]> => ipcRenderer.invoke('get-logs'),
  getMaps: (): Promise<any> => ipcRenderer.invoke('get-maps'),
  setMaps: (name: string, map: any): Promise<void> => ipcRenderer.invoke('set-maps', name, map),
  getAppData: (appId: string): Promise<{ [key: string]: string }> =>
    ipcRenderer.invoke('get-app-data', appId),
  getSettings: (): Promise<any> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any): Promise<void> => ipcRenderer.invoke('save-settings', settings),
  saveAppSetting: (
    appId: string,
    setting: { id: string; value: string | number | boolean }
  ): Promise<void> =>
    ipcRenderer.invoke('send-to-app', {
      app: appId,
      type: 'set',
      request: 'settings',
      payload: setting
    }),
  saveAppData: (appId: string, data: { [key: string]: string | any }): Promise<void> =>
    ipcRenderer.invoke('set-app-data', appId, data),
  getClientManifest: (): Promise<any> => ipcRenderer.invoke('get-client-manifest'),
  setClientManifest: (manifest: any): Promise<void> =>
    ipcRenderer.invoke('set-client-manifest', manifest)
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

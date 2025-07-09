import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { platform as currentPlatform } from 'os'
import { ProgressEvent } from '@shared/types'
import { app } from './api/ipcApps'
import { client } from './api/ipcClient'
import { utility } from './api/ipcUtility'
import { task } from './api/ipcTask'
import { releases } from './api/ipcReleases'
import { update } from './api/ipcUpdate'
import { feedback } from './api/ipcFeedback'
import { platform } from './api/ipcPlatform'
import { device } from './api/ipcDevice'

// Custom APIs for renderer
const api = {
  app,
  client,
  device,
  feedback,
  releases,
  task,
  update,
  utility,
  platform,
  onProgress: (callback: (event: ProgressEvent) => void): (() => void) => {
    const listener = (_event: unknown, data: ProgressEvent): void => callback(data)
    ipcRenderer.on('progress:event', listener)
    return () => {
      ipcRenderer.removeListener('progress:event', listener)
    }
  }
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
    contextBridge.exposeInMainWorld('electronAPI', {
      platform: currentPlatform()
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ...electronAPI, ...api }
}

import { ElectronAPI } from '@electron-toolkit/preload'
import { ProgressEvent } from '@shared/types'

declare global {
  interface Window {
    electronAPI: {
      platform: NodeJS.Platform
    }
    electron: ElectronAPI & {
      app: typeof import('./api/ipcApps').app
      client: typeof import('./api/ipcClient').client
      device: typeof import('./api/ipcDevice').device
      feedback: typeof import('./api/ipcFeedback').feedback
      releases: typeof import('./api/ipcReleases').releases
      task: typeof import('./api/ipcTask').task
      update: typeof import('./api/ipcUpdate').update
      utility: typeof import('./api/ipcUtility').utility
      platform: typeof import('./api/ipcPlatform').platform
      onProgress: (callback: (event: ProgressEvent) => void) => () => void
    }
  }
}

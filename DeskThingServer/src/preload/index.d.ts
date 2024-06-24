import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}

interface Window {
  api: Api
  electron: typeof import('@electron-toolkit/preload').electronAPI
}

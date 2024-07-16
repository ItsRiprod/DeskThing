import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      selectZipFile: () => Promise<{ name: string; path: string } | null>
      runAdbCommand: (command: string) => Promise<string | null>
      runDeviceCommand: (type: string, command: string) => Promise<void>
    }
    api: unknown // Or define `api` more specifically if you have a shape for it
  }
}

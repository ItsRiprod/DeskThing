import { ElectronAPI } from '@electron-toolkit/preload'

type AppData = { [key: string]: string }

declare global {
  interface Window {
    electron: ElectronAPI & {
      selectZipFile: () => Promise<{ name: string; path: string } | null>
      runAdbCommand: (command: string) => Promise<string | null>
      runDeviceCommand: (type: string, command: string) => Promise<void>
      fetchReleases: (url: string) => Promise<[]>
      getLogs: () => Promise<string[]>
      getMaps: () => Promise<any>
      setMaps: (name: string, map: any) => Promise<void>
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<void>
      saveAppSetting: (
        appId: string,
        settings: { id: string; value: string | number | boolean }
      ) => Promise<void>
      saveAppData: (appId: string, data: { [key: string]: string | any }) => Promise<void>
      getAppData: (appId: string) => Promise<AppData>
      getClientManifest: () => Promise<any>
      setClientManifest: (manifest: any) => Promise<void>
    }
    api: unknown // Or define `api` more specifically if you have a shape for it
  }
}

import { App, AppReleaseSingleMeta, AppSettings } from '@DeskThing/types'
import { LoggingData, StagedAppManifest } from '@shared/types'
import { create } from 'zustand'
import useSettingsStore from './settingsStore'

interface AppStoreState {
  appsList: App[]
  order: string[]
  logging: LoggingData | null
  stagedManifest: StagedAppManifest | null
  iconCache: Record<string, string>

  clearIconCache: () => void
  requestApps: () => void
  removeAppFromList: (appName: string) => void
  addApp: (data: {
    appPath?: string
    releaseMeta?: AppReleaseSingleMeta
  }) => Promise<StagedAppManifest | void>
  runStagedApp: (overwrite?: boolean) => Promise<void>
  setOrder: (order: string[]) => void
  addAppToList: (appName: string) => void
  disableApp: (appName: string) => void
  stopApp: (appName: string) => void
  runApp: (appName: string) => void
  enableApp: (appName: string) => void
  getAppData: (appName: string) => Promise<Record<string, string> | null>
  setAppData: (appName: string, data: Record<string, string>) => void
  getAppSettings: (appName: string) => Promise<AppSettings | null>
  setAppSettings: (appName: string, settings: AppSettings) => void
  setAppList: (apps: App[]) => void
  getIcon: (appName: string, icon?: string) => Promise<string | null>
  getIconUrl: (appName: string, icon?: string) => string
}

/**
 * The AppStore is a Zustand store that manages the state of the application, including the list of apps, their order, and logging data.
 *
 * The store provides the following functionality:
 * - Requesting the list of apps from the Electron app
 * - Setting the entire list of apps
 * - Removing an app from the list
 * - Setting the order of the apps
 * - Adding a new app to the list
 * - Disabling an app
 * - Stopping an app
 * - Enabling an app
 * - Running an app
 * - Getting the data for a specific app
 * - Setting the data for a specific app
 * - Loading an app from a URL
 * - Loading an app from a ZIP file
 *
 * The store uses the Zustand library to manage the state and provide the necessary actions.
 */
const useAppStore = create<AppStoreState>((set, get) => ({
  appsList: [],
  order: [],
  logging: null,
  stagedManifest: null,
  iconCache: {},

  // Requests the apps from Electron via IPC
  requestApps: async (): Promise<void> => {
    const apps = await window.electron.getApps() // Assuming this is wrapped in a promise
    set({ appsList: apps, order: apps.map((app) => app.name), iconCache: {} })
  },

  // Sets the entire list of apps
  setAppList: async (apps: App[]): Promise<void> => {
    const { order } = get()
    set({ appsList: apps })

    const missingApps = apps.filter((app) => !order.includes(app.name))

    set({ order: [...order, ...missingApps.map((app) => app.name)] })
  },

  // moves an app from the list
  removeAppFromList: (appName: string): void => {
    set((state) => ({
      appsList: state.appsList.filter((app) => app.name !== appName),
      order: state.order.filter((app) => app !== appName)
    }))
  },

  // Sets the app order
  setOrder: (order: string[]): void => {
    window.electron.orderApps(order)
    set({ order })
  },

  // Adds a new app to the list
  addAppToList: (appName: string): void => {
    set((state) => {
      let newAppName = appName
      if (appName.endsWith('.zip')) {
        newAppName = appName.replace('.zip', '')
      }
      const appData: App = {
        name: newAppName,
        enabled: false,
        running: false,
        prefIndex: 0,
        timeStarted: 0
      }
      return {
        appsList: [...state.appsList, appData],
        order: [...state.order, newAppName]
      }
    })
  },
  // Disables an app (set enabled to false)
  disableApp: (appName: string): void => {
    window.electron.disableApp(appName)
    set((state) => ({
      appsList: state.appsList.map((app) =>
        app.name === appName ? { ...app, enabled: false } : app
      )
    }))
    window.electron.getApps()
  },

  stopApp: (appName: string): void => {
    window.electron.stopApp(appName)
    set((state) => ({
      appsList: state.appsList.map((app) =>
        app.name === appName ? { ...app, running: false } : app
      )
    }))
  },

  enableApp: (appName: string): void => {
    window.electron.enableApp(appName)
    set((state) => ({
      appsList: state.appsList.map((app) =>
        app.name === appName ? { ...app, enabled: true } : app
      )
    }))
  },

  runApp: (appName: string): void => {
    window.electron.runApp(appName)
    set((state) => ({
      appsList: state.appsList.map((app) =>
        app.name === appName ? { ...app, running: true } : app
      )
    }))
  },

  getAppData: async (appName: string): Promise<Record<string, string> | null> => {
    return await window.electron.getAppData(appName)
  },

  setAppData: (appName: string, data: { [key: string]: string }): void => {
    window.electron.setAppData(appName, data)
  },

  getAppSettings: async (appName: string): Promise<AppSettings | null> => {
    return await window.electron.getAppSettings(appName)
  },

  setAppSettings: (appName: string, settings: AppSettings): void => {
    window.electron.setAppSettings(appName, settings)
  },

  addApp: async ({
    appPath,
    releaseMeta
  }: {
    appPath?: string
    releaseMeta?: AppReleaseSingleMeta
  }): Promise<StagedAppManifest | void> => {
    const loggingListener = async (_event: Electron.Event, reply: LoggingData): Promise<void> => {
      set({ logging: reply })
      if (reply.final === true || reply.status === false) {
        removeListener()
      }
    }
    const removeListener = window.electron.ipcRenderer.on('logging', loggingListener)

    window.electron.app.add({ appPath, releaseMeta }).then(async (manifest) => {
      if (manifest) {
        set({ stagedManifest: manifest })
      }
    })
  },

  runStagedApp: async (overwrite: boolean = false): Promise<void> => {
    const manifest = get().stagedManifest
    if (manifest?.id) {
      await window.electron.app.runStaged(manifest.id, overwrite)
      set({ stagedManifest: null }) // clear the staged manifest once done
    } else {
      console.error('No staged manifest found! Please download an app first')
      set({ stagedManifest: null })
    }
  },

  getIcon: async (appName: string, icon?: string): Promise<string | null> => {
    const cacheKey = `${appName}-${icon || appName}`
    const { iconCache } = get()

    // Return cached icon if available
    if (iconCache[cacheKey]) {
      return iconCache[cacheKey]
    }

    // Fetch and cache new icon
    const iconContent = await window.electron.app.getIcon(appName, icon)
    if (iconContent) {
      set((state) => ({
        iconCache: {
          ...state.iconCache,
          [cacheKey]: iconContent
        }
      }))
    }
    return iconContent
  },
  clearIconCache: (): void => {
    set({ iconCache: {} })
  },

  getIconUrl: (appName: string, icon?: string): string => {
    const settings = useSettingsStore.getState().settings
    const url = `http://localhost:${settings.devicePort}/icons/${appName}/icons/${icon || appName}.svg`
    return url
  }
}))

export default useAppStore

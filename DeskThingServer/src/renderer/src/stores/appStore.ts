import { App, AppReturnData, AppSettings, LoggingData, AppManifest } from '@shared/types'
import { create } from 'zustand'

interface AppStoreState {
  appsList: App[]
  order: string[]
  logging: LoggingData | null
  stagedManifest: AppManifest | null

  requestApps: () => void
  removeAppFromList: (appName: string) => void
  /**
   * @depreciated
   */
  loadAppUrl: (appName: string) => Promise<AppReturnData | null>
  /**
   * @depreciated
   */
  loadAppZip: (appName: string) => Promise<AppReturnData | null>
  addApp: (path: string) => Promise<AppManifest | void>
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

  // Requests the apps from Electron via IPC
  requestApps: async (): Promise<void> => {
    const apps = await window.electron.getApps() // Assuming this is wrapped in a promise
    set({ appsList: apps, order: apps.map((app) => app.name) })
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

  setAppData: (appName: string, data: Record<string, string>): void => {
    window.electron.setAppData(appName, data)
  },

  getAppSettings: async (appName: string): Promise<AppSettings | null> => {
    return await window.electron.getAppSettings(appName)
  },

  setAppSettings: (appName: string, settings: AppSettings): void => {
    window.electron.setAppSettings(appName, settings)
  },

  loadAppUrl: async (appName: string): Promise<AppReturnData | null> => {
    const response = window.electron.handleAppUrl(appName)

    const loggingListener = (_event, reply: LoggingData): void => {
      set({ logging: reply })
      if (reply.final === true || reply.status === false) {
        removeListener()
      }
    }
    const removeListener = window.electron.ipcRenderer.on('logging', loggingListener)
    return response
  },

  loadAppZip: async (appName: string): Promise<AppReturnData | null> => {
    const response = window.electron.handleAppZip(appName)

    const loggingListener = (_event, reply: LoggingData): void => {
      set({ logging: reply })
      if (reply.final === true || reply.status === false) {
        removeListener()
      }
    }
    const removeListener = window.electron.ipcRenderer.on('logging', loggingListener)

    return response
  },

  addApp: async (appPath: string): Promise<AppManifest | void> => {
    const manifest = await window.electron.app.add(appPath)
    if (manifest) {
      set({ stagedManifest: manifest })
    }
    return manifest
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
  }
}))

export default useAppStore

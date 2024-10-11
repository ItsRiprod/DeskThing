import { App, AppDataInterface } from '@shared/types'
import { create } from 'zustand'

interface AppStoreState {
  appsList: App[]
  order: string[]

  requestApps: () => void
  removeAppFromList: (appName: string) => void
  loadAppUrl: (appName: string) => void
  loadAppZip: (appName: string) => void
  setOrder: (order: string[]) => void
  addAppToList: (appName: string) => void
  disableApp: (appName: string) => void
  stopApp: (appName: string) => void
  runApp: (appName: string) => void
  enableApp: (appName: string) => void
  getAppData: (appName: string) => Promise<AppDataInterface | null>
  setAppData: (appName: string, data: AppDataInterface) => void
  setAppList: (apps: App[]) => void
}

const useAppStore = create<AppStoreState>((set) => ({
  appsList: [],
  order: [],

  // Requests the apps from Electron via IPC
  requestApps: async (): Promise<void> => {
    const apps = await window.electron.getApps() // Assuming this is wrapped in a promise
    set({ appsList: apps, order: apps.map((app) => app.name) })
  },

  // Sets the entire list of apps
  setAppList: (apps: App[]): void => {
    set({ appsList: apps, order: apps.map((app) => app.name) })
  },

  // moves an app from the list
  removeAppFromList: (appName: string): void => {
    set((state) => ({
      appsList: state.appsList.filter((app) => app.name !== appName)
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
        prefIndex: 0
      }
      return {
        appsList: [...state.appsList, appData]
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

  getAppData: async (appName: string): Promise<AppDataInterface | null> => {
    return await window.electron.getAppData(appName)
  },

  setAppData: (appName: string, data: AppDataInterface): void => {
    window.electron.setAppData(appName, data)
  },

  loadAppUrl: (appName: string): void => {
    window.electron.handleAppUrl(appName)
  },

  loadAppZip: (appName: string): void => {
    window.electron.handleAppZip(appName)
  }
}))

export default useAppStore

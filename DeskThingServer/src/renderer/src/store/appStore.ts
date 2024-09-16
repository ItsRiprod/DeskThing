import { useState, useEffect } from 'react'
import { EventEmitter } from '../utility/eventEmitter'

export interface Manifest {
  isAudioSource: boolean
  requires: Array<string>
  label: string
  version: string
  description?: string
  author?: string
  platforms: Array<string>
  homepage?: string
  repository?: string
}

export interface App {
  name: string
  enabled: boolean
  running: boolean
  prefIndex: number
  manifest?: Manifest
}

export interface Config {
  [appName: string]: string | Array<string>
}

interface appStoreEvents {
  update: App[]
}

class AppStore extends EventEmitter<appStoreEvents> {
  private static instance: AppStore
  private appsList: App[]

  constructor() {
    super()
    this.appsList = []
    window.electron.ipcRenderer.on('app-data', this.handleAppData.bind(this))
    window.electron.ipcRenderer.send('get-apps')
  }

  static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore()
    }
    return AppStore.instance
  }

  private handleAppData(_event, response): void {
    this.setAppList(response.data)
  }

  public getAppsList(): App[] {
    return this.appsList
  }

  public removeAppFromList(appName: string): void {
    const existingAppIndex = this.appsList['apps'].findIndex((app: App) => app.name === appName)
    if (existingAppIndex !== -1) {
      this.appsList['apps'].splice(existingAppIndex)
      this.emit('update', this.appsList)
      console.log('App removed', appName, this.appsList)
    } else {
      console.log('App not found in the list!')
    }
  }

  public addAppToList(appName: string): void {
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

    if (!this.appsList['apps']) {
      this.appsList['apps'] = []
    }

    this.appsList['apps'].push(appData)
    this.emit('update', this.appsList)
  }

  public disableApp(appName: string): void {
    if (this.appsList['apps'] == null) {
      this.appsList = []
      this.emit('update', this.appsList)
      console.log('Clearing data because apps is null')
    }
    const existingAppIndex = this.appsList['apps'].findIndex((app: App) => app.name === appName)
    if (existingAppIndex !== -1) {
      this.appsList[existingAppIndex].enabled = false
      this.emit('update', this.appsList)
      console.log('App disabled', appName)
    } else {
      console.log(`App ${appName} not found in the list!`, this.appsList)
    }
  }

  public setAppList(apps: App[]): void {
    this.appsList = apps
    this.emit('update', this.appsList)
  }
}

export const appStoreInstance = AppStore.getInstance()

interface AppStoreHook {
  appsList: App[]
  addAppToList: (appName: string) => void
  removeAppFromList: (appName: string) => void
  setAppList: (apps: App[]) => void
  disableApp: (appName: string) => void
}

export const useAppStore = (): AppStoreHook => {
  const [appsList, setAppsList] = useState<App[]>(appStoreInstance.getAppsList())

  const addAppToList = (appName: string): void => {
    appStoreInstance.addAppToList(appName)
  }

  const removeAppFromList = (appName: string): void => {
    appStoreInstance.removeAppFromList(appName)
  }

  const setAppList = (apps: App[]): void => {
    appStoreInstance.setAppList(apps)
  }

  const disableApp = (appName: string): void => {
    appStoreInstance.disableApp(appName)
  }

  useEffect(() => {
    const handleUpdate = (newAppsList: App[]): void => {
      if (newAppsList) {
        setAppsList(newAppsList)
      }
    }

    appStoreInstance.on('update', handleUpdate)

    return () => {
      appStoreInstance.off('update', handleUpdate)
    }
  }, [])

  return { appsList, addAppToList, setAppList, removeAppFromList, disableApp }
}

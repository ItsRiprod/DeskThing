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
  prefIndex: number
  manifest?: Manifest
}
export interface AppData {
  apps: App[]
  config?: Config
}

export interface Config {
  [appName: string]: string | Array<string>
}

class AppStore extends EventEmitter {
  private appsList: AppData

  constructor() {
    super()
    this.appsList = {
      apps: []
    }
  }

  public getAppsList(): AppData {
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
      this.appsList = { apps: [] }
      this.emit('update', this.appsList)
      console.log('Clearing data because apps is null')
    }
    const existingAppIndex = this.appsList['apps'].findIndex((app: App) => app.name === appName)
    if (existingAppIndex !== -1) {
      this.appsList.apps[existingAppIndex].enabled = false
      this.emit('update', this.appsList)
      console.log('App disabled', appName)
    } else {
      console.log(`App ${appName} not found in the list!`, this.appsList)
    }
  }

  public setAppList(apps: AppData): void {
    this.appsList = apps
    this.emit('update', this.appsList)
  }
}

export const appStoreInstance = new AppStore()

export const useAppStore = (): any => {
  const [appsList, setAppsList] = useState<AppData>(appStoreInstance.getAppsList())

  const addAppToList = (appName: string): void => {
    appStoreInstance.addAppToList(appName)
  }

  const removeAppFromList = (appName: string): void => {
    appStoreInstance.removeAppFromList(appName)
  }

  const setAppList = (apps: AppData): void => {
    appStoreInstance.setAppList(apps)
  }

  const disableApp = (appName: string): void => {
    appStoreInstance.disableApp(appName)
  }

  useEffect(() => {
    const handleUpdate = (newAppsList: AppData): void => {
      setAppsList(newAppsList)
      console.log('Updating things', newAppsList)
    }

    appStoreInstance.on('update', handleUpdate)

    return () => {
      appStoreInstance.off('update', handleUpdate)
    }
  }, [])

  return { appsList, addAppToList, setAppList, removeAppFromList, disableApp }
}

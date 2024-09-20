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
  private order: string[]

  constructor() {
    super()
    this.appsList = []
    this.order = []
    window.electron.ipcRenderer.on('app-data', this.handleAppData.bind(this))
    this.requestApps()
  }

  static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore()
    }
    return AppStore.instance
  }

  public requestApps = (): void => {
    window.electron.ipcRenderer.send('get-apps')
  }

  private handleAppData(_event, response): void {
    console.log('Received app data:', response)
    this.setAppList(response.data)
    this.order = response.data.map((app) => app.name)
  }

  public getAppsList(): App[] {
    return this.appsList
  }

  public getOrder(): string[] {
    return this.order
  }
  public setOrder(order: string[]): void {
    this.order = order
    window.electron.ipcRenderer.send('set-app-order', this.order)
    this.requestApps()
  }

  public removeAppFromList(appName: string): void {
    const existingAppIndex = this.appsList.findIndex((app: App) => app.name === appName)
    if (existingAppIndex !== -1) {
      this.appsList.splice(existingAppIndex)
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

    if (!this.appsList) {
      this.appsList = []
    }

    this.appsList.push(appData)
    this.emit('update', this.appsList)
  }

  public disableApp(appName: string): void {
    if (this.appsList == null) {
      this.appsList = []
      this.emit('update', this.appsList)
      console.log('Clearing data because apps is null')
    }
    const existingAppIndex = this.appsList.findIndex((app: App) => app.name === appName)
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

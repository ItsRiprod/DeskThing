/**
 * TODO: Finish setting up clientStore to save client details and data
 */

import { EventEmitter } from '../utility/eventEmitter'

export interface ServerManifest {
  name: string
  id: string
  short_name: string
  description: string
  builtFor: string
  reactive: boolean
  author: string
  version: string
  port: number
  ip: string
}

interface ClientStoreEvents {
  connection: ServerManifest
  disconnect: ServerManifest
}

class ClientStore extends EventEmitter<ClientStoreEvents> {
  private static instance: ClientStore
  private connectedApps: ServerManifest[]

  constructor() {
    super()
    this.appsList = {
      apps: []
    }
  }
  static getInstance(): ClientStore {
    if (!ClientStore.instance) {
      ClientStore.instance = new ClientStore()
    }
    return ClientStore.instance
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

export default ClientStore.getInstance()


/**
 * TODO: Finish setting up clientStore to save client details and data
 */

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

type EVENTS = 'ADBDevices' | 'Connections' | 'numConnections' | string

type callback = (data: string[]) => void
type connectionCallback = (data: number) => void

export class ClientStore {
  private static instance: ClientStore
  private ADBDevices: string[] = []
  private numConnections: number = 0
  //private connectedApps: ServerManifest[] = []
  listeners: { [key in EVENTS]: callback[] } = {}
  private connectionListeners: connectionCallback[] = []
  constructor() {
    window.electron.ipcRenderer.on('connections', (event, data) =>
      this.handleConnection(event, data.data)
    )
    this.requestADBDevices()
    this.getConnections()
    //this.appsList = {
    //  apps: []
    //}
  }

  static getInstance(): ClientStore {
    if (!ClientStore.instance) {
      ClientStore.instance = new ClientStore()
    }
    return ClientStore.instance
  }

  handleConnection = (_event, num: number): void => {
    this.numConnections = num
    this.connectionListeners.forEach((callback) => callback(this.numConnections))
  }

  requestADBDevices = async (): Promise<string[]> => {
    const response = await window.electron.runAdbCommand('devices')
    if (response) {
      console.log(response)
      // Assuming response is a string with device names separated by newline
      const deviceList = response
        .split('\n')
        .filter(
          (line) => line && !line.startsWith('List of devices attached') && line.trim() !== ''
        )
        .map((line) => line.replace('device', '').trim())
      this.ADBDevices = deviceList
      this.notifyListeners('ADBDevices', deviceList)
      return deviceList
    } else {
      console.log('No devices found')
      return []
    }
  }
  requestConnections = (): void => window.electron.ipcRenderer.send('get-connections')

  getConnections = (): number => {
    return this.numConnections
  }

  getADBDevices = async (): Promise<string[]> => {
    if (this.ADBDevices) {
      return this.ADBDevices
    } else {
      return this.requestADBDevices()
    }
  }
  onConnection(callback: connectionCallback): () => void {
    if (this.connectionListeners) {
      this.connectionListeners.push(callback)
    } else {
      this.connectionListeners = [callback]
    }

    return () => {
      this.connectionListeners = this.connectionListeners.filter((cb) => cb !== callback)
    }
  }

  on(event: EVENTS, callback: callback): () => void {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    } else {
      this.listeners[event] = [callback]
    }

    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  notifyListeners(event: EVENTS, data: string[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }

  /*
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
    */
}

export default ClientStore.getInstance()

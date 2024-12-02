console.log('[AppState Service] Starting')
import { App, AppInstance, Manifest, AppReturnData, MESSAGE_TYPES } from '@shared/types'
import { sendConfigData, sendSettingsData } from '../client/clientCom'
import loggingStore from '../../stores/loggingStore'

/**
 * TODO: Sync with the file
 */
export class AppHandler {
  public static instance: AppHandler
  private apps: { [key: string]: AppInstance } = {}
  private order: string[] = []

  public static getInstance(): AppHandler {
    if (!AppHandler.instance) {
      AppHandler.instance = new AppHandler()
    }
    return AppHandler.instance
  }

  constructor() {
    this.loadApps()
  }

  /**
   * Notifies the client that there were changes
   */
  async notify(): Promise<void> {
    sendConfigData()
    sendSettingsData()
  }

  /**
   * Loads the apps from file
   */
  async loadApps(): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[appState] [loadApps]: Loading apps...')
    const { getAppData } = await import('../../handlers/configHandler')

    const data = await getAppData()

    data.apps.forEach((app) => {
      if (this.apps[app.name]) {
        // Update existing app instance with stored data
        Object.assign(this.apps[app.name], app)
      } else {
        // Create new AppInstance
        this.apps[app.name] = {
          ...app,
          func: {} // Initialize empty func object for AppInstance
        }
      }

      // Ensure app is in the order array
      if (!this.order.includes(app.name)) {
        this.order.push(app.name)
      }
    })
  }

  private async saveAppsToFile(): Promise<void> {
    const { setAppsData } = await import('../../handlers/configHandler')
    const apps = this.getAllBase()
    await setAppsData(apps)
    this.notify()
  }

  private async saveAppToFile(name: string): Promise<void> {
    const { setAppData } = await import('../../handlers/configHandler')
    const { func: _func, ...app } = this.apps[name]
    await setAppData(app)
  }

  add(app: AppInstance): void {
    if (this.apps[app.name]) {
      // If the app already exists, merge the new app with the existing one
      this.apps[app.name] = {
        ...this.apps[app.name],
        ...app,
        func: {
          ...this.apps[app.name].func,
          ...app.func
        }
      }
    } else {
      // If it's a new app, add it to the apps object
      this.apps[app.name] = app
      // Add the new app name to the order array
      this.order.push(app.name)
    }
    this.saveAppsToFile()
  }
  /**
   * Gets a specific app from the cache
   * @param name The ID of the app
   * @returns
   */
  get(name: string): AppInstance | undefined {
    return this.apps[name]
  }

  /**
   * Returns all the apps in the order they should be displayed
   * @description Get all apps
   * @returns all apps
   */
  getAll(): AppInstance[] {
    return this.order.map((name) => this.apps[name])
  }

  getAllBase(): App[] {
    const baseApp = this.order.map((name) => {
      const { func: _func, ...baseApp } = this.apps[name]
      return baseApp
    })
    return baseApp
  }
  remove(name: string): boolean {
    if (!(name in this.apps)) {
      return false
    }
    delete this.apps[name]
    this.order = this.order.filter((app) => app !== name)
    this.saveAppsToFile()
    return true
  }
  async purge(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }

    const app = this.apps[name]
    if (typeof app.func.purge === 'function') {
      await app.func.purge()
    }
    this.remove(name)

    import('./appManager').then(({ purgeApp }) => {
      purgeApp(name)
    })

    // Saves all apps
    this.remove(name)
    return true
  }

  reorder(order: string[]): void {
    this.order = order
    // Save new order
    this.saveAppsToFile()
  }
  setItemOrder(name: string, newIndex: number): void {
    const index = this.order.indexOf(name)
    if (index !== -1) {
      this.order.splice(index, 1)
      this.order.splice(newIndex, 0, name)
    }
    this.saveAppsToFile()
  }
  getOrder(): string[] {
    return this.order
  }

  /**
   * Enables the app so that it will be run on startup
   * @param name The ID of the app
   * @returns
   */
  enable(name: string): boolean {
    if (!(name in this.apps)) {
      return false
    }
    this.apps[name].enabled = true
    this.saveAppToFile(name)
    return true
  }

  /**
   * Disabling an app will clear the cache from everything but the files it is stored in.
   * Additionally, a disabled app wont be run on startup
   * @param name THe ID of the app to disable
   * @returns
   */
  async disable(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }

    this.stop(name)
    this.apps[name].enabled = false

    if (typeof this.apps[name].func.purge === 'function') {
      await this.apps[name].func.purge()
    }

    import('./appManager').then(({ clearCache }) => {
      clearCache(name)
    })

    this.apps[name].func = {}

    this.saveAppToFile(name)
    return true
  }

  /**
   * Stopping the app will just try to ask the app to stop
   * @param name The ID of the app
   * @returns
   */
  async stop(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }

    this.apps[name].running = false

    // Start clearing the cache
    if (typeof this.apps[name].func.stop === 'function') {
      await this.apps[name].func.stop()
    }

    this.saveAppToFile(name)
    return true
  }

  /**
   * Attempts to run the app assuming it has never been run before
   * @param name The ID of the app
   * @returns
   */
  async run(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }

    this.apps[name].running = true
    this.enable(name)

    const { run } = await import('./appInstaller')
    await run(name)
    this.saveAppToFile(name)
    return true
  }

  async start(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }

    this.apps[name].running = true
    this.enable(name)
    const { start } = await import('./appInstaller')
    return await start(name)
  }

  async addURL(url: string, reply): Promise<AppReturnData | void> {
    const { handleZipFromUrl } = await import('./appInstaller')
    const returnData = await handleZipFromUrl(url, reply)
    if (returnData) {
      const App: AppInstance = {
        name: returnData.appId,
        enabled: false,
        running: false,
        prefIndex: 10,
        func: {}
      }

      this.add(App)

      return returnData
    }
  }
  async addZIP(zip: string, event): Promise<AppReturnData | void> {
    const { handleZip } = await import('./appInstaller')
    const returnData = await handleZip(zip, event)
    if (returnData) {
      const App: AppInstance = {
        name: returnData.appId,
        enabled: false,
        running: false,
        prefIndex: 10,
        func: {}
      }

      this.add(App)

      return returnData
    }
  }

  /**
   * Appends a manifest to the app
   * @param manifest
   * @param appName
   */
  async appendManifest(manifest: Manifest, appName: string): Promise<void> {
    if (this.apps[appName]) {
      this.apps[appName].manifest = manifest
    }
    const { addAppManifest } = await import('../../handlers/configHandler')
    // Add the manifest to the config file
    addAppManifest(manifest, appName)
    this.saveAppToFile(appName)
  }
}

export default AppHandler.getInstance()

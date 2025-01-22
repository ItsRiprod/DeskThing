console.log('[AppState Service] Starting')
import {
  App,
  AppInstance,
  AppManifest,
  AppReturnData,
  MESSAGE_TYPES,
  AppDataInterface,
  ToAppData,
  SettingsType,
  AppSettings,
  ReplyFn
} from '@shared/types'
import { loggingStore } from '@server/stores'
import { getData, overwriteData, setData } from '@server/services/files/dataService'

type AppsListener = (data: App[]) => void
type AppSettingsListener = (appId: string, data: AppSettings) => void

type AppStoreListeners = {
  apps?: AppsListener[]
  settings?: AppSettingsListener[]
}

type ListenerEvents = 'settings' | 'apps'

export class AppStore {
  public static instance: AppStore
  private apps: { [key: string]: AppInstance } = {}
  private order: string[] = []
  private listeners: AppStoreListeners = {}
  private functionTimeouts: { [key: string]: NodeJS.Timeout } = {}

  public static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore()
    }
    return AppStore.instance
  }

  constructor() {
    this.loadApps()
  }

  async notifySettings(appId: string, settings: AppSettings): Promise<void> {
    if (this.listeners.settings) {
      await Promise.all(this.listeners.settings.map((listener) => listener(appId, settings)))
    }
  }

  async notifyApps(apps?: App[]): Promise<void> {
    if (!apps) {
      apps = this.getAllBase()
    }

    if (this.functionTimeouts['server-notifyApps']) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[AppStore] Cancelling previous notifyApps timeout and starting a new one`
      )
      clearTimeout(this.functionTimeouts['server-notifyApps'])
    }
    this.functionTimeouts['server-notifyApps'] = setTimeout(async () => {
      loggingStore.log(
        MESSAGE_TYPES.DEBUG,
        `[AppStore] Notifying apps listeners with ${apps.length} apps`
      )
      if (this.listeners.apps) {
        await Promise.all(this.listeners.apps.map((listener) => listener(apps)))
      }
    }, 500)
  }

  on(event: ListenerEvents, listener: AppsListener | AppSettingsListener): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    ;(this.listeners[event] as (AppsListener | AppSettingsListener)[]).push(listener)
  }
  off(event: ListenerEvents, listener: AppsListener | AppSettingsListener): void {
    if (this.listeners[event]) {
      this.listeners[event] = (
        this.listeners[event] as (AppsListener | AppSettingsListener)[]
      ).filter((l) => l !== listener) as AppSettingsListener[] & AppsListener[]
    }
  }

  /**
   * Loads the apps from file
   */
  async loadApps(): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[appState] [loadApps]: Loading apps...')
    const { getAppData } = await import('../services/files/appService')

    const data = await getAppData()

    Object.values(data).map((app) => {
      if (this.apps[app.name]) {
        // Update existing app instance with stored data
        this.apps[app.name] = { ...this.apps[app.name], ...app }
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
    const { setAppsData } = await import('../services/files/appService')

    if (this.functionTimeouts['server-saveApps']) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[saveAppsToFile]: Cancelling previous saveApps timeout and starting a new one`
      )
      clearTimeout(this.functionTimeouts['server-saveApps'])
    }

    this.functionTimeouts['server-saveApps'] = setTimeout(async () => {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[saveAppsToFile]: Saving apps to file`)
      const apps = this.getAllBase()
      await setAppsData(apps)
      this.notifyApps(apps)
    }, 500)
  }

  private async saveAppToFile(name: string): Promise<void> {
    const { setAppData } = await import('../services/files/appService')
    const { func: _func, ...app } = this.apps[name]

    // Clear any existing timeout for this app
    if (this.functionTimeouts[name]) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[saveAppsToFile]: Cancelling previous ${name} request and starting a new one`
      )
      clearTimeout(this.functionTimeouts[name])
    }

    // Set new timeout
    this.functionTimeouts[name] = setTimeout(async () => {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[saveAppsToFile]: Saving ${name} to file and notifying apps listeners`
      )
      await setAppData(app)
      this.notifyApps()
      delete this.functionTimeouts[name]
    }, 500)
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

    const { purgeApp } = await import('../services/apps/appManager')

    await purgeApp(name)

    // Saves all apps
    this.remove(name)
    return true
  }

  reorder(order: string[]): void {
    // Keep existing items and add any new ones from the provided order
    const newOrder = [...this.order]
    order.forEach((item) => {
      if (!newOrder.includes(item)) {
        newOrder.push(item)
      }
    })
    // Reorder according to new order while keeping items that weren't in the new order
    this.order = order.concat(newOrder.filter((item) => !order.includes(item)))
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

  async getData(name: string): Promise<{ [key: string]: string } | undefined> {
    if (!(name in this.apps)) {
      return
    }
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[AppStore.getData] Getting Data for ', name)
    const data = await getData(name)
    return data?.data
  }

  async getSettings(name: string): Promise<AppSettings | undefined> {
    if (!(name in this.apps)) {
      loggingStore.log(MESSAGE_TYPES.WARNING, `[AppStore.getSettings] App ${name} not found`)
      return
    }
    const data = await getData(name)
    return data?.settings
  }

  async addData(app: string, data: { [key: string]: string }): Promise<void> {
    if (!this.apps[app]) return

    const result = await setData(app, { data: data })

    if (!result) {
      const version = this.apps[app].manifest?.version
      const appData = {
        settings: {},
        data: data,
        version: version || 'v0.0.0'
      } as AppDataInterface

      await setData(app, appData)
    } else {
      // set the cache with the data
    }
  }

  // merge with existing settings
  async addSettings(app: string, settings: AppSettings): Promise<void> {
    console.log('[AppStore] Adding settings to app:', app)
    if (!this.apps[app]) return

    const result = await setData(app, { settings })

    if (!result) {
      console.log('There is no file, so making one with settings added')
      const version = this.apps[app].manifest?.version

      const appData = {
        settings: settings,
        data: {},
        version: version || 'v0.0.0'
      } as AppDataInterface
      await setData(app, appData)
    }
  }

  /**
   * Deletes a provided setting
   */
  async delSettings(app: string, settings: string[] | string): Promise<void> {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      '[AppStore.delSettings] Deleting settings from app:',
      app
    )
    if (!this.apps[app]) return

    const data = await getData(app)

    if (!data || !data.settings || data.settings == undefined) return

    const settingsToDelete = Array.isArray(settings) ? settings : [settings]

    const newSettings = { ...data.settings }
    settingsToDelete.forEach((key) => {
      delete newSettings[key]
    })

    data.settings = newSettings

    await overwriteData(app, data)

    this.notifySettings(app, newSettings)
  }

  /**
   * Deletes provided data
   */
  async delData(app: string, dataIds: string[] | string): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[AppStore.delData] Deleting data from app:', app)
    if (!this.apps[app]) return

    const data = await getData(app)

    if (!data || !data.data || data.data == undefined) return

    const dataToDelete = Array.isArray(dataIds) ? dataIds : [dataIds]

    const newData = { ...data.data }
    dataToDelete.forEach((key) => {
      delete newData[key]
    })

    data.data = newData

    await overwriteData(app, data)
  }

  async addSetting(app: string, id: string, setting: SettingsType): Promise<void> {
    let appData = await getData(app)

    if (!this.apps[app]) return

    if (!appData) {
      const version = this.apps[app].manifest?.version

      appData = {
        settings: {},
        data: {},
        version: version || 'v0.0.0'
      } as AppDataInterface
    }

    if (appData.settings && appData?.settings[id]) {
      appData.settings[id] = setting
    } else {
      appData.settings = {
        [id]: setting
      }
    }

    const result = await setData(app, appData)

    if (!result) {
      loggingStore.warn(`[addSettings]: Something went wrong updating settings for ${app}!`)
    }
  }

  async sendDataToApp(name: string, data: ToAppData): Promise<void> {
    try {
      const app = this.apps[name]

      if (!app) {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[sendDataToApp]: App ${name} not found.`)
        return
      }

      if (app && typeof app.func.toClient === 'function') {
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `[sendDataToApp] Sending message to ${name} with ${data.type}`
        )
        app.func.toClient(data)
      } else {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `[sendDataToApp]: App ${name} does not have toClient function. (try restarted it?)`
        )
      }
    } catch (e) {
      console.error(
        `[sendDataToApp]: Error attempting to send message to app ${name} with ${data.type} and data: `,
        data,
        e
      )

      if (e instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[sendDataToApp]: ${e.message}`)
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[sendDataToApp]: Unknown error ` + String(e))
      }
    }
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

    import('../services/apps/appManager').then(({ clearCache }) => {
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
    // Early break
    if (!(name in this.apps)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `[run]: App ${name} not found.`)
      return false
    }

    this.apps[name].running = true
    this.enable(name)

    const { run } = await import('../services/apps/appInstaller')
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
    const { start } = await import('../services/apps/appInstaller')
    return await start(name)
  }

  /**
   * @depreciated - use addApp instead
   * @param url
   * @param reply
   * @returns
   */
  async addURL(url: string, reply): Promise<AppReturnData | void> {
    loggingStore.log(
      MESSAGE_TYPES.FATAL,
      'addURL is deprecated and will be removed in a future version'
    )
    const { handleZipFromUrl } = await import('../services/apps/appInstaller')
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

  /**
   * @depreciated - use addApp instead
   * @param zip
   * @param event
   * @returns
   */
  async addZIP(zip: string, event): Promise<AppReturnData | void> {
    loggingStore.log(
      MESSAGE_TYPES.FATAL,
      'addZIP is deprecated and will be removed in a future version'
    )
    const { handleZip } = await import('../services/apps/appInstaller')
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

  async runStagedApp({
    reply,
    overwrite,
    appId,
    run = true
  }: {
    reply?: ReplyFn
    overwrite?: boolean
    appId?: string
    run?: boolean
  }): Promise<void> {
    const { executeStagedFile } = await import('../services/apps/appInstaller')
    return await executeStagedFile({ reply, overwrite, appId, run })
  }

  /**
   * Adds an app to the app store
   * @param appPath The app path (url or local path) to add
   * @returns The app manifest that was added
   */
  async addApp(appPath: string, reply: ReplyFn): Promise<AppManifest | undefined> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `[store.addApp]: Running addApp for ${appPath}`)
    const { stageAppFile } = await import('../services/apps/appInstaller')

    try {
      reply &&
        reply('logging', {
          status: true,
          data: 'Staging file...',
          final: false
        })
      const newAppManifest = await stageAppFile(appPath, reply)

      if (!newAppManifest) {
        reply &&
          reply('logging', {
            status: false,
            data: 'Unable to stage app',
            final: true
          })
        return
      }

      reply &&
        reply('logging', {
          status: true,
          data: 'Finalizing...',
          final: true
        })

      return newAppManifest
    } catch (e) {
      if (e instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[store.addApp]: ${e.message}`)
        reply &&
          reply('logging', {
            status: false,
            data: 'Unable to stage app',
            error: e.message,
            final: true
          })
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[store.addApp]: Unknown error ` + String(e))
        reply &&
          reply('logging', {
            status: false,
            data: 'Unable to stage app',
            error: String(e),
            final: true
          })
      }
      return
    }
  }

  /**
   * Appends a manifest to the app
   * @param manifest
   * @param appName
   */
  async appendManifest(manifest: AppManifest, appName: string): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `Appending manifest to ${appName}`)
    if (this.apps[appName]) {
      this.apps[appName].manifest = manifest
    }
    this.saveAppToFile(appName)
  }
}

export default AppStore.getInstance()

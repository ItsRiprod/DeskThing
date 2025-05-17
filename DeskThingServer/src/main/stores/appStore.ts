// Types
import {
  AppDataFilters,
  AppProcessTypes,
  AppProcessListener,
  AppProcessStoreClass
} from '@shared/stores/appProcessStore'
import {
  App,
  AppManifest,
  LOGGING_LEVELS,
  APP_REQUESTS,
  DESKTHING_EVENTS,
  DeskThingToAppData
} from '@deskthing/types'
import { StagedAppManifest, CacheableStore, ProgressChannel } from '@shared/types'
import {
  AppStoreClass,
  AppStoreListeners,
  AppStoreListenerEvents,
  AppStoreListener
} from '@shared/stores/appStore'

// Utils
import Logger from '@server/utils/logger'

// Services
import { getIcon } from '@server/services/apps/appUtils'
import {
  executeStagedFile,
  stageAppFile,
  stageAppFileType
} from '@server/services/apps/appInstaller'
import { loadAndRunEnabledApps } from '@server/services/apps/appRunner'
import { setAppData, setAppsData } from '../services/files/appFileService'

// // Validation
import { sanitizeAppMeta } from '@server/services/apps/appValidator'
import { AuthStoreClass } from '@shared/stores/authStore'
import { nextTick } from 'node:process'
import { progressBus } from '@server/services/events/progressBus'
import { runPostInstall } from '@server/services/apps/appPostinstall'

export class AppStore implements CacheableStore, AppStoreClass {
  private apps: Record<string, App> = {}
  private order: string[] = []
  private listeners: AppStoreListeners = {
    apps: [],
    purging: []
  }
  private appProcessStore: AppProcessStoreClass
  private authStore: AuthStoreClass
  private functionTimeouts: Record<string, NodeJS.Timeout> = {}
  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  constructor(appProcessStore: AppProcessStoreClass, authStore: AuthStoreClass) {
    this.appProcessStore = appProcessStore
    this.authStore = authStore
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.appProcessStore.initialize()
    this.initializeListeners()
    await this.loadApps()
  }

  private initializeListeners = (): void => {
    this.appProcessStore.on(AppProcessTypes.STARTED, this.handleProcessStarted.bind(this))
    this.appProcessStore.on(AppProcessTypes.RUNNING, this.handleProcessRunning.bind(this))
    this.appProcessStore.on(AppProcessTypes.STOPPED, this.handleProcessStopped.bind(this))
    this.appProcessStore.on(AppProcessTypes.ERROR, this.handleProcessError.bind(this))
    this.appProcessStore.on(AppProcessTypes.EXITED, this.handleProcessExit.bind(this))

    // App Handling
    this.onAppMessage(APP_REQUESTS.TOAPP, (data) => {
      this.sendDataToApp(data.source, data.payload)
    })

    this.authStore.on('appData', (data) => {
      if (this.apps[data.app]) {
        this.sendDataToApp(data.app, {
          type: DESKTHING_EVENTS.CALLBACK_DATA,
          payload: data.callbackData
        })
      }
    })
  }

  private handleProcessStarted(appName: string): void {
    if (this.apps[appName]) {
      this.apps[appName].enabled = true
      this.saveAppToFile(appName)
    }
  }

  private handleProcessRunning(appName: string): void {
    if (this.apps[appName]) {
      this.apps[appName].running = true
      this.apps[appName].enabled = true
      this.apps[appName].timeStarted = Date.now()
      this.saveAppToFile(appName)
    }
  }

  private handleProcessStopped(appName: string): void {
    if (this.apps[appName]) {
      this.apps[appName].running = false
      this.saveAppToFile(appName)
    }
  }

  // Could be non-fatal
  private handleProcessError(appName: string, error?: string): void {
    Logger.error(`Process error for ${appName}: ${error || 'Unknown error'}`, {
      source: 'AppStore',
      function: 'handleProcessError',
      domain: appName
    })
  }

  // Always runs if the process exists
  private handleProcessExit(appName: string, error?: string): void {
    Logger.error(`Process error for ${appName}: ${error || 'Unknown error'}`, {
      source: 'AppStore',
      function: 'handleProcessError',
      domain: appName
    })

    if (this.apps[appName]) {
      this.apps[appName].running = false
      this.saveAppToFile(appName)
    }
  }

  clearCache = async (): Promise<void> => {
    // Clear any pending timeouts
    Object.values(this.functionTimeouts).forEach((timeout) => {
      clearTimeout(timeout)
    })
    this.functionTimeouts = {}
  }

  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {
    await this.saveAppsToFile()
    const savePromises = Object.keys(this.apps).map((appName) => this.saveAppToFile(appName))
    await Promise.all(savePromises)
  }

  /**
   * Loads the apps from file
   */
  private async loadApps(): Promise<void> {
    Logger.debug('Loading apps...', { source: 'AppStore', function: 'loadApps' })
    const { getAppData } = await import('../services/files/appFileService')

    const data = await getAppData()

    Object.values(data).map((app) => {
      if (this.apps[app.name]) {
        // Update existing app instance with stored data
        this.apps[app.name] = { ...this.apps[app.name], ...app }
      } else {
        // Create new AppInstance
        this.apps[app.name] = {
          ...app
        }
      }

      // Ensure app is in the order array
      if (!this.order.includes(app.name)) {
        this.order.push(app.name)
      }
    })

    // Wait another tick because it takes two for the UI to load - this is a low priority task
    nextTick(async () => {
      await loadAndRunEnabledApps()
    })
  }

  async notifyApps(apps?: App[]): Promise<void> {
    if (!apps) {
      apps = this.getAll()
    }

    // If there is a timeout running
    if (this.functionTimeouts['server-notifyApps']) {
      Logger.debug(`Cancelling previous notifyApps timeout and starting a new one`, {
        source: 'AppStore',
        function: 'notifyApps'
      })

      // Clear the timeout
      clearTimeout(this.functionTimeouts['server-notifyApps'])

      // Start a new one with the current data
      this.functionTimeouts['server-notifyApps'] = setTimeout(async () => {
        await this.notifyListeners('apps', { data: apps })
        delete this.functionTimeouts['server-notifyApps']
      }, 500)
    } else {
      // Start a "hold" so that later timeouts are debounced
      this.functionTimeouts['server-notifyApps'] = setTimeout(() => {
        delete this.functionTimeouts['server-notifyApps'] // Clean up after timeout
      }, 500)

      // Update data immediately
      await this.notifyListeners('apps', { data: apps })
    }
  }

  private notifyListeners = async <K extends keyof AppStoreListenerEvents>(
    event: K,
    payload: AppStoreListenerEvents[K]
  ): Promise<void> => {
    if (this.listeners[event]) {
      await Promise.all(this.listeners[event].map((listener) => listener(payload)))
    }
  }

  /**
   * Subscribe to messages from a specific app or all apps
   * @param type The message type to listen for
   * @param listener The callback function to execute when message is received
   * @returns A function to unsubscribe the listener
   */
  onAppMessage<T extends APP_REQUESTS>(
    type: T,
    listener: AppProcessListener<T>,
    filters?: AppDataFilters<T>
  ): () => void {
    // Create a wrapper for the listener
    const wrappedListener: AppProcessListener<T> = async (data) => {
      Logger.debug(`Received message from ${data.source}: ${data.type}:${data.request}`, {
        source: 'AppStore',
        function: 'onAppMessage'
      })

      Logger.debug(JSON.stringify(data.payload), {
        source: 'AppStore',
        function: 'onAppMessage'
      })

      try {
        if (filters?.request && data.request !== filters.request) return
        if (filters?.app && data.source !== filters.app) return
        await listener(data)
      } catch (error) {
        Logger.error(`Error in app message listener for type ${type}`, {
          error: error as Error,
          source: 'AppStore',
          function: 'onAppMessage'
        })
      }
    }

    // Register with the process store using wrapped listener
    this.appProcessStore.on(type as APP_REQUESTS, wrappedListener)

    return () => this.appProcessStore.off(type as APP_REQUESTS, wrappedListener)
  }

  on<K extends keyof AppStoreListenerEvents>(event: K, listener: AppStoreListener<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
    return () => this.off(event, listener)
  }

  off<K extends keyof AppStoreListenerEvents>(event: K, listener: AppStoreListener<K>): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (l) => l !== listener
      ) as AppStoreListeners[K]
    }
  }

  private async saveAppsToFile(): Promise<void> {
    if (this.functionTimeouts['server-saveApps']) {
      Logger.debug(`Cancelling previous saveApps timeout and starting a new one`, {
        source: 'AppStore',
        function: 'saveAppsToFile'
      })
      clearTimeout(this.functionTimeouts['server-saveApps'])
      this.functionTimeouts['server-saveApps'] = setTimeout(async () => {
        Logger.debug(`Saving apps to file`, {
          source: 'AppStore',
          function: 'saveAppsToFile'
        })
        const apps = this.getAll()
        await setAppsData(apps)
        this.notifyApps(apps)
        delete this.functionTimeouts['server-saveApps']
      }, 500)
    } else {
      this.functionTimeouts['server-saveApps'] = setTimeout(async () => {
        delete this.functionTimeouts['server-saveApps']
      }, 500)
      Logger.debug(`Saving apps to file`, {
        source: 'AppStore',
        function: 'saveAppsToFile'
      })
      const apps = this.getAll()
      await setAppsData(apps)
      this.notifyApps(apps)
    }
  }

  private async saveAppToFile(name: string): Promise<void> {
    const app = this.apps[name]

    // Clear any existing timeout for this app
    if (this.functionTimeouts[name]) {
      Logger.debug(`Cancelling previous ${name} request and starting a new one`, {
        source: 'AppStore',
        domain: name,
        function: 'saveAppToFile'
      })
      clearTimeout(this.functionTimeouts[name])
      this.functionTimeouts[name] = setTimeout(async () => {
        Logger.debug(`Saving ${name} to file and notifying apps listeners`, {
          source: 'AppStore',
          domain: name,
          function: 'saveAppToFile'
        })
        await setAppData(app)
        this.notifyApps()
        delete this.functionTimeouts[name]
      }, 500)
    } else {
      this.functionTimeouts[name] = setTimeout(async () => {
        delete this.functionTimeouts[name]
      }, 500)
      Logger.debug(`Saving ${name} to file and notifying apps listeners`, {
        source: 'AppStore',
        domain: name,
        function: 'saveAppToFile'
      })
      await setAppData(app)
      this.notifyApps()
    }
  }

  add(app: App): void {
    sanitizeAppMeta(app)
    if (this.apps[app.name]) {
      // If the app already exists, merge the new app with the existing one
      this.apps[app.name] = {
        ...this.apps[app.name],
        ...app
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
  get(name: string): App | undefined {
    return this.apps[name]
  }

  /**
   * Returns all the apps in the order they should be displayed
   * @description Gets all apps
   * @returns all apps
   */
  getAll(): App[] {
    return this.order.map((name) => this.apps[name])
  }

  /**
   * Gets all of the apps in the system
   * @returns
   * @deprecated - use {@link AppStore.getAll} instead
   */
  getAllBase(): App[] {
    const baseApp = this.order.map((name) => {
      const baseApp = this.apps[name]
      return baseApp
    })
    return baseApp
  }

  async purge(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }
    try {
      this.appProcessStore.postMessage(name, { type: 'purge' })
    } catch {
      Logger.info(`It doesn't appear that ${name} was running`)
    }

    await this.notifyListeners('purging', { appName: name })
    // Wait for the app to fully purge
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Forcibly kill it
    await this.disable(name)
    await this.remove(name)
    return true
  }

  /**
   * Removes an app from the app store
   * @param name The ID of the app
   * @returns
   */
  private async remove(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }
    delete this.apps[name]
    this.order = this.order.filter((app) => app !== name)
    await this.saveAppsToFile()
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

  async broadcastToApps(data: DeskThingToAppData): Promise<void> {
    const apps = this.getOrder()
    Logger.debug(
      `Broadcasting to ${apps.length} apps: ${JSON.stringify({ ...data, payload: 'Scrubbed Payload' })}`
    )
    apps.forEach((appId) => {
      this.appProcessStore.postMessage(appId, {
        type: 'data',
        payload: data
      })
    })
  }

  async sendDataToApp(name: string, data: DeskThingToAppData): Promise<void> {
    try {
      Logger.debug(`Sending data to ${name}`, {
        source: 'AppStore',
        function: 'sendDataToApp',
        domain: name
      })
      await this.appProcessStore.postMessage(name, {
        type: 'data',
        payload: data
      })
    } catch (error) {
      Logger.error(`Error sending data to app ${name}: ${error}`, {
        source: 'AppStore',
        function: 'sendDataToApp',
        domain: name
      })
    }
  }

  /**
   * Enables the app so that it will be run on startup
   * @param name The ID of the app
   * @returns
   */
  async enable(name: string): Promise<boolean> {
    const app = this.apps[name]
    if (!app) {
      return false
    }

    const result = await this.appProcessStore.spawnProcess(app)
    return result
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
    // Wait for the app to stop
    await new Promise((resolve) => setTimeout(resolve, 500))
    const result = await this.appProcessStore.terminateProcess(name)
    return result
  }

  /**
   * Stopping the app will just try to ask the app to stop
   * @param name The ID of the app
   * @returns
   */
  async stop(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      Logger.warn(`App ${name} was not found`, {
        source: 'AppStore',
        function: 'stop',
        domain: 'SERVER.' + name.toUpperCase()
      })
      return false
    }

    try {
      await this.appProcessStore.postMessage(name, {
        type: DESKTHING_EVENTS.STOP
      })
    } catch {
      Logger.info(`It doesn't appear ${name} was running`)
    }

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
      Logger.error(`[run]: App ${name} not found.`, {
        function: 'run',
        source: 'AppStore'
      })
      return false
    }

    await this.start(name)
    return true
  }

  // Run when the user clicks on the play button
  async start(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      Logger.warn(`App ${name} was not found`, {
        source: 'AppStore',
        function: 'start',
        domain: 'SERVER.' + name.toUpperCase()
      })
      return false
    }

    if (!this.apps[name].enabled) {
      const result = await this.enable(name)
      if (!result) {
        Logger.warn(`Unable to enable ${name}`, {
          source: 'AppStore',
          function: 'start',
          domain: 'SERVER.' + name.toUpperCase()
        })
        return false
      }
    } else if (!this.appProcessStore.getActiveProcessIds().includes(name)) {
      const result = await this.enable(name)
      if (!result) {
        Logger.warn(`Unable to enable ${name}`, {
          source: 'AppStore',
          function: 'start',
          domain: 'SERVER.' + name.toUpperCase()
        })
        return false
      }
    }

    const manifest = this.apps[name].manifest

    // Check if all required apps are running
    if (manifest?.requires?.length) {
      const validRequirements = manifest.requires.filter((req) => req.trim().length > 0)

      if (validRequirements.length > 0) {
        const missingApps = manifest.requires.filter(
          (requiredApp) =>
            !this.apps[requiredApp] ||
            !this.appProcessStore.getActiveProcessIds().includes(requiredApp)
        )
        if (missingApps.length > 0) {
          Logger.warn(
            `[start(${name})]: Unable to run ${name}! Missing required apps: ${missingApps.join(', ')}`,
            {
              source: 'AppStore',
              domain: 'SERVER.' + name.toUpperCase(),
              function: 'start'
            }
          )
          return false
        }
      }
    }

    Logger.debug(`Sending start command to ${name}`, {
      source: 'AppStore',
      function: 'start',
      domain: 'SERVER.' + name.toUpperCase()
    })

    try {
      this.appProcessStore.postMessage(name, {
        type: DESKTHING_EVENTS.START
      })
    } catch (error) {
      Logger.error(`Error starting ${name}: ${error}`, {
        source: 'AppStore',
        function: 'start',
        error: error as Error,
        domain: 'SERVER.' + name.toUpperCase()
      })
    }

    return true
  }

  /**
   * Runs the currently staged app
   * @returns Promise<void>
   */
  async runStagedApp({
    overwrite,
    appId,
    run = true
  }: {
    overwrite?: boolean
    appId?: string
    run?: boolean
  }): Promise<void> {
    progressBus.startOperation(
      ProgressChannel.ST_APP_INITIALIZE,
      'Running App',
      'Initializing app run',
      [
        {
          channel: ProgressChannel.FN_APP_POSTINSTALL,
          weight: 3
        },
        {
          channel: ProgressChannel.FN_APP_INITIALIZE,
          weight: 7
        }
      ]
    )

    try {
      // Runs the postinstall script
      await runPostInstall()
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_APP_INITIALIZE,
        'Error running app',
        'Error while trying to run staged app'
      )
      Logger.error('Error while trying to run staged app', {
        function: 'runStagedApp',
        source: 'AppStore',
        error: error as Error
      })
    }

    try {
      // TODO: Update to use the process
      await executeStagedFile({ overwrite, appId, run })
      progressBus.complete(ProgressChannel.ST_APP_INITIALIZE, 'Run App', 'App run successfully')
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_APP_INITIALIZE,
        'Error running app',
        'Error while trying to run staged app'
      )
      Logger.error('Error while trying to run staged app', {
        function: 'runStagedApp',
        source: 'AppStore',
        error: error as Error
      })
    }
  }

  /**
   * Adds an app to the app store
   * @param filePath The app path (url or local path) to add
   * @returns The app manifest that was added
   */
  async addApp({
    filePath,
    releaseMeta
  }: stageAppFileType): Promise<StagedAppManifest | undefined> {
    Logger.log(LOGGING_LEVELS.LOG, `[store.addApp]: Running addApp for ${filePath}`)

    try {
      progressBus.startOperation(
        ProgressChannel.ST_APP_INSTALL,
        'Adding App',
        'Initializing app installation',
        [
          {
            channel: ProgressChannel.FN_APP_INSTALL,
            weight: 8
          }
        ]
      )
      const newAppManifest = await stageAppFile({ filePath, releaseMeta })

      if (!newAppManifest) {
        progressBus.error(
          ProgressChannel.ST_APP_INSTALL,
          'Error staging app',
          'Unable to find the new app manifest'
        )
        return
      }

      progressBus.complete(ProgressChannel.ST_APP_INSTALL, 'Add App', 'App added successfully')

      return newAppManifest
    } catch (e) {
      if (e instanceof Error) {
        Logger.error(`[store.addApp]: ${e.message}`)
        progressBus.error(ProgressChannel.ST_APP_INSTALL, 'Error staging app', e.message)
      } else {
        Logger.error(`[store.addApp]: Unknown error ` + String(e))
        progressBus.error(ProgressChannel.ST_APP_INSTALL, 'Error staging app', String(e))
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
    Logger.log(LOGGING_LEVELS.LOG, `Appending manifest to ${appName}`)
    if (this.apps[appName]) {
      this.apps[appName].manifest = manifest
    }
    await this.saveAppToFile(appName)
  }

  /**
   * Fetches the icon.svg from the file system and returns the file:// path for it
   */
  async getIcon(appName: string, icon?: string): Promise<string | null> {
    return await getIcon(appName, icon)
  }
}

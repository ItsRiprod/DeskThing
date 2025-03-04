console.log('[AppState Service] Starting')
import {
  App,
  AppManifest,
  LOGGING_LEVELS,
  AppDataInterface,
  SettingsType,
  AppSettings,
  ServerEvent,
  EventPayload,
  Step,
  Task,
  DeskThingType
} from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { getData, overwriteData, setData } from '@server/services/files/dataFileService'
import { isValidAppSettings, loadAndRunEnabledApps, stageAppFileType } from '@server/services/apps'
import {
  ReplyFn,
  TaskReference,
  AppInstance,
  StagedAppManifest,
  CacheableStore
} from '@shared/types'
import { isValidStep, isValidTask } from '@server/services/task'
import logger from '@server/utils/logger'

type addSettingsOptions = {
  notifyApp?: boolean
  notifyServer?: boolean
}

type AppStoreListenerEvents = {
  apps: { data: App[] }
  settings: { appId: string; data: AppSettings }
}

// Create listener types automatically from event map
type Listener<T> = (payload: T) => void
type AppStoreListener<K extends keyof AppStoreListenerEvents> = Listener<AppStoreListenerEvents[K]>

// Create listeners collection type automatically
type AppStoreListeners = {
  [K in keyof AppStoreListenerEvents]: AppStoreListener<K>[]
}

export class AppStore implements CacheableStore {
  public static instance: AppStore
  private apps: Record<string, AppInstance> = {}
  private order: string[] = []
  private listeners: AppStoreListeners = {
    apps: [],
    settings: []
  }
  private functionTimeouts: Record<string, NodeJS.Timeout> = {}

  public static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore()
    }
    return AppStore.instance
  }

  constructor() {
    this.loadApps()
    this.setupListeners()
  }

  /**
   * @implements CacheableStore
   */
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

  private async setupListeners(): Promise<void> {
    import('@server/stores/taskStore').then(({ default: taskStore }) => {
      taskStore.on('taskList', async (tasks) => {
        Object.values(tasks.tasks).map((task) => {
          if (task.source && task.started) {
            if (this.apps[task.source]) {
              this.updateTaskList(task.source, task)
            }
          }
        })
      })

      taskStore.on('step', async (payload) => {
        if (payload.source && payload.taskId && payload.step) {
          if (this.apps[payload.source]) {
            this.updateStep(payload.source, payload.taskId, payload.step)
          }
        }
      })

      taskStore.on('task', async (payload) => {
        if (payload.source && payload.id) {
          if (this.apps[payload.source]) {
            this.updateTask(payload.source, payload)
          }
        }
      })
    })
  }

  /**
   * Loads the apps from file
   */
  private async loadApps(): Promise<void> {
    Logger.info('Loading apps...', { source: 'AppStore', function: 'loadApps' })
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
    await loadAndRunEnabledApps()
  }

  async notifyApps(apps?: App[]): Promise<void> {
    if (!apps) {
      apps = this.getAllBase()
    }

    if (this.functionTimeouts['server-notifyApps']) {
      Logger.info(`Cancelling previous notifyApps timeout and starting a new one`, {
        source: 'AppStore'
      })
      clearTimeout(this.functionTimeouts['server-notifyApps'])
    }
    this.functionTimeouts['server-notifyApps'] = setTimeout(async () => {
      Logger.debug(`Notifying apps listeners with ${apps.length} apps`, {
        source: 'AppStore'
      })
      await this.notifyListeners('apps', { data: apps })
    }, 500)
  }

  async notifySettings(
    appId: string,
    settings: AppSettings,
    { notifyApp = true, notifyServer = true }: addSettingsOptions = {
      notifyApp: true,
      notifyServer: true
    }
  ): Promise<void> {
    notifyServer && this.notifyListeners('settings', { appId, data: settings })
    notifyApp && this.notifyAppsOfSettings(appId, settings)
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
   * Notifies the app directly of a change in its settings
   */
  private async notifyAppsOfSettings(
    appId: string,
    setting: Record<string, SettingsType>
  ): Promise<void> {
    console.log(new Error().stack)
    Logger.info('Sending settings to app', {
      source: 'AppStore',
      domain: appId,
      function: 'notifyAppsOfSettings'
    })
    this.sendDataToApp(appId, {
      type: ServerEvent.SETTINGS,
      payload: setting
    })
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
    const { setAppsData } = await import('../services/files/appFileService')

    if (this.functionTimeouts['server-saveApps']) {
      Logger.info(`Cancelling previous saveApps timeout and starting a new one`, {
        source: 'AppStore',
        function: 'saveAppsToFile'
      })
      clearTimeout(this.functionTimeouts['server-saveApps'])
    }

    this.functionTimeouts['server-saveApps'] = setTimeout(async () => {
      Logger.info(`Saving apps to file`, {
        source: 'AppStore',
        function: 'saveAppsToFile'
      })
      const apps = this.getAllBase()
      await setAppsData(apps)
      this.notifyApps(apps)
    }, 500)
  }

  private async saveAppToFile(name: string): Promise<void> {
    const { setAppData } = await import('../services/files/appFileService')
    const { func: _func, ...app } = this.apps[name]

    // Clear any existing timeout for this app
    if (this.functionTimeouts[name]) {
      Logger.info(`Cancelling previous ${name} request and starting a new one`, {
        source: 'AppStore',
        domain: name,
        function: 'saveAppToFile'
      })
      clearTimeout(this.functionTimeouts[name])
    }

    // Set new timeout
    this.functionTimeouts[name] = setTimeout(async () => {
      Logger.info(`Saving ${name} to file and notifying apps listeners`, {
        source: 'AppStore',
        domain: name,
        function: 'saveAppToFile'
      })
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
        } as DeskThingType
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
  async remove(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }
    delete this.apps[name]
    this.order = this.order.filter((app) => app !== name)
    await this.saveAppsToFile()
    return true
  }

  async purge(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      return false
    }

    const app = this.apps[name]
    if (typeof app.func?.purge === 'function') {
      await app.func.purge()
    }

    const { purgeApp } = await import('../services/apps/appManager')

    try {
      await purgeApp(name)
    } catch (error) {
      Logger.error(`Error purging app ${name}`, {
        source: 'AppStore',
        domain: name,
        function: 'purge',
        error: error as Error
      })
    }

    // Saves all apps
    await this.remove(name)
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

  async getAppData(name: string): Promise<AppDataInterface | undefined> {
    if (!(name in this.apps)) {
      return
    }
    Logger.info('Getting Data', {
      source: 'AppStore',
      domain: name,
      function: 'getData'
    })
    const data = await getData(name)
    return data
  }

  async getData(name: string): Promise<Record<string, string> | undefined> {
    if (!(name in this.apps)) {
      return
    }
    Logger.info('Getting Data', {
      source: 'AppStore',
      domain: name,
      function: 'getData'
    })
    const data = await getData(name)
    return data?.data
  }

  async getSettings(name: string): Promise<AppSettings | undefined> {
    if (!(name in this.apps)) {
      Logger.warn(`App ${name} not found`, {
        source: 'AppStore',
        domain: name,
        function: 'getSettings'
      })
      return
    }
    const data = await getData(name)
    return data?.settings
  }

  async getTasks(name: string): Promise<{ [key: string]: Task } | undefined> {
    if (!(name in this.apps)) {
      Logger.warn(`App ${name} not found`, {
        source: 'AppStore',
        domain: name,
        function: 'getTasks'
      })
      return
    }
    const data = await getData(name)
    return data?.tasks
  }

  async addData(app: string, data: Record<string, string>): Promise<void> {
    if (!this.apps[app]) return

    const result = await setData(app, { data: data })

    if (!result) {
      const version = this.apps[app].manifest?.version
      const appData = {
        settings: {},
        data: data,
        tasks: {},
        version: version || 'v0.0.0'
      } as AppDataInterface

      await setData(app, appData)
    } else {
      // set the cache with the data
    }
  }

  async addAppData(app: string, data: AppDataInterface): Promise<void> {
    if (!this.apps[app]) return

    const result = await setData(app, data)

    if (!result) {
      const version = this.apps[app].manifest?.version
      const appData = {
        ...data,
        version: version || 'v0.0.0'
      } as AppDataInterface

      await setData(app, appData)
    } else {
      // set the cache with the data
    }
  }

  async setTasks(app: string, tasks: Record<string, Task>): Promise<void> {
    if (!this.apps[app]) return

    const result = await setData(app, { tasks })
    const { taskStore } = await import('@server/stores')
    taskStore.addTasks(tasks)

    if (!result) {
      const version = this.apps[app].manifest?.version
      const appData = {
        settings: {},
        data: {},
        tasks: tasks,
        version: version || 'v0.0.0'
      } as AppDataInterface

      await setData(app, appData)
    }
  }

  async updateTaskList(app: string, task: Task): Promise<void> {
    if (!this.apps[app]) return

    try {
      isValidTask(task)
    } catch (error) {
      Logger.error('Invalid task', {
        source: 'AppStore',
        domain: app,
        function: 'updateTaskList',
        error: error as Error
      })
      return
    }

    const data = await getData(app)
    if (!data) {
      await this.setTasks(app, { [task.id]: task })
      return
    }

    const updatedTasks: Record<string, Task> = {
      ...data.tasks,
      [task.id]: task as Task
    }

    this.sendDataToApp(app, { type: ServerEvent.TASKS, request: 'update', payload: updatedTasks })

    await setData(app, { tasks: updatedTasks })
  }

  async updateStep(app: string, taskId: string, step: Partial<Step>): Promise<void> {
    if (!this.apps[app]) return

    try {
      isValidStep(step)
    } catch (error) {
      Logger.error('Invalid step', {
        source: 'AppStore',
        domain: app,
        function: 'updateStep',
        error: error as Error
      })
      return
    }

    const data = await getData(app)
    if (!data) return
    if (!data?.tasks?.[taskId]) return

    data.tasks[taskId].steps[step.id] = step

    this.sendDataToApp(app, { type: ServerEvent.TASKS, request: 'step', payload: step })

    await setData(app, { tasks: data.tasks })
  }

  async updateTask(app: string, task: Partial<Task>): Promise<void> {
    if (!this.apps[app]) return

    try {
      isValidTask(task)
    } catch (error) {
      Logger.error('Invalid task', {
        source: 'AppStore',
        domain: app,
        function: 'updateTask',
        error: error as Error
      })
      return
    }

    const data = await getData(app)
    if (!data) return

    if (!data?.tasks?.[task.id]) {
      if (!data.tasks) data.tasks = {}
      data.tasks[task.id] = task
    } else {
      data.tasks[task.id] = { ...data.tasks[task.id], ...task }
    }

    this.sendDataToApp(app, {
      type: ServerEvent.TASKS,
      request: 'task',
      payload: data.tasks[task.id]
    })

    await setData(app, { tasks: data.tasks })
  }

  // merge with existing settings
  addSettings = async (
    app: string,
    settings: AppSettings,
    { notifyApp = true, notifyServer = true }: addSettingsOptions = {
      notifyApp: true,
      notifyServer: true
    }
  ): Promise<void> => {
    Logger.info('Adding settings to app', {
      source: 'AppStore',
      domain: app,
      function: 'addSettings'
    })
    if (!this.apps[app]) return

    try {
      isValidAppSettings(settings)
    } catch (error) {
      Logger.error('Invalid settings', {
        source: 'AppStore',
        domain: 'SERVER.' + app.toUpperCase(),
        function: 'addSettings',
        error: error as Error
      })
      return
    }

    await this.notifySettings(app, settings, { notifyServer, notifyApp })

    const result = await setData(app, { settings: settings })

    if (!result) {
      Logger.info('There is no file, so making one with settings added', {
        source: 'AppStore',
        domain: app,
        function: 'addSettings'
      })
      const version = this.apps[app].manifest?.version

      const appData = {
        settings: settings,
        data: {},
        tasks: {},
        version: version || 'v0.0.0'
      } as AppDataInterface
      await setData(app, appData)
    }
  }

  /**
   * Deletes a provided setting
   */
  async delSettings(app: string, settings: string[] | string): Promise<void> {
    Logger.info('Deleting settings from app', {
      source: 'AppStore',
      domain: app,
      function: 'delSettings'
    })
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
    Logger.info('Deleting data from app:' + app, {
      source: 'AppStore',
      domain: app,
      function: 'delData'
    })
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

  async delTasks(app: string, taskIds: string[] | string): Promise<void> {
    Logger.info('Deleting tasks from app', {
      source: 'AppStore',
      domain: app,
      function: 'delTasks'
    })
    if (!this.apps[app]) return

    const data = await getData(app)

    if (!data || !data.tasks || data.tasks == undefined) return

    const tasksToDelete = Array.isArray(taskIds) ? taskIds : [taskIds]

    const newTasks = { ...data.tasks }
    tasksToDelete.forEach((key) => {
      delete newTasks[key]
    })

    data.tasks = newTasks

    await overwriteData(app, data)
  }

  completeStep = async (taskRef: Task | TaskReference, stepId: string): Promise<void> => {
    Logger.info('Completing task', {
      source: 'AppStore',
      domain: taskRef.source,
      function: 'completeStep'
    })
    if (!this.apps[taskRef.source]) {
      Logger.error(`App ${taskRef.source} was not found in the system or is not running`, {
        source: 'AppStore',
        domain: taskRef.source,
        function: 'completeStep'
      })
      return
    }
    const task = (await this.getTasks(taskRef.source))?.[taskRef.id] as Task

    if (!task) {
      Logger.error(`Task ${taskRef.label} was not found in the system or is not running`, {
        source: 'AppStore',
        domain: taskRef.source,
        function: 'completeStep'
      })
      return
    }

    this.sendDataToApp(task.source, {
      type: ServerEvent.TASKS,
      payload: { ...task.steps[stepId], parentId: task.id } as Step,
      request: 'step'
    })
  }

  async addSetting(app: string, id: string, setting: SettingsType): Promise<void> {
    let appData = await getData(app)

    if (!this.apps[app]) return

    if (!appData) {
      const version = this.apps[app].manifest?.version

      appData = {
        settings: {},
        data: {},
        tasks: {},
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

    // Notify of the updated setting
    await this.notifySettings(app, { [id]: setting })

    const result = await setData(app, appData)

    if (!result) {
      Logger.warn(`Something went wrong updating settings!`, {
        source: 'AppStore',
        domain: 'SERVER.' + app.toUpperCase(),
        function: 'addSetting'
      })
    }
  }

  async sendDataToApp(name: string, data: EventPayload): Promise<void> {
    try {
      const app = this.apps[name]

      if (!app) {
        Logger.error(`App ${name} not found.`, {
          source: 'AppStore',
          domain: name,
          error: Error(`App ${name} not found.`),
          function: 'sendDataToApp'
        })
        return
      }

      if (app && typeof app.func?.toClient === 'function') {
        Logger.info(`Sending message with ${data.type}`, {
          source: 'AppStore',
          domain: 'SERVER.' + name.toUpperCase(),
          function: 'sendDataToApp'
        })
        app.func?.toClient(data)
      } else {
        Logger.error(`App does not have toClient function. (try restarted it?)`, {
          source: 'AppStore',
          domain: 'SERVER.' + name.toUpperCase(),
          function: 'sendDataToApp'
        })
      }
    } catch (e) {
      if (e instanceof Error) {
        Logger.error('Got error trying to send data: ' + e.message, {
          source: 'AppStore',
          domain: name,
          error: e as Error,
          function: 'sendDataToApp'
        })
      } else {
        Logger.error(`Unknown error: `, {
          source: 'AppStore',
          error: e as Error,
          domain: name,
          function: 'sendDataToApp'
        })
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

    if (typeof this.apps[name].func?.purge === 'function') {
      await this.apps[name].func.purge()
    }

    const { clearCache } = await import('../services/apps/appManager')
    await clearCache(name)

    this.apps[name].func = undefined

    await this.saveAppToFile(name)
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
    if (typeof this.apps[name].func?.stop === 'function') {
      await this.apps[name].func.stop()
    }

    await this.saveAppToFile(name)
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
      console.log('App list', this.apps)
      return false
    }

    this.apps[name].running = true
    this.apps[name].timeStarted = Date.now()
    await this.enable(name)

    const { run } = await import('../services/apps/appInstaller')
    await run(this.apps[name])
    await this.saveAppToFile(name)
    return true
  }

  async start(name: string): Promise<boolean> {
    if (!(name in this.apps)) {
      Logger.info(`App ${name} was not found`)
      return false
    }

    this.apps[name].running = true
    this.enable(name)
    const { start } = await import('../services/apps/appInstaller')
    return await start(name)
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
    try {
      return await executeStagedFile({ reply, overwrite, appId, run })
    } catch (error) {
      logger.error('Error while trying to run staged app', {
        function: 'runStagedApp',
        source: 'AppStore',
        error: error as Error
      })
      reply &&
        reply('logging', {
          status: false,
          data: 'Error while trying to run staged app',
          final: true
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
    releaseMeta,
    reply
  }: stageAppFileType): Promise<StagedAppManifest | undefined> {
    Logger.log(LOGGING_LEVELS.LOG, `[store.addApp]: Running addApp for ${filePath}`)
    const { stageAppFile } = await import('../services/apps/appInstaller')

    try {
      reply &&
        reply('logging', {
          status: true,
          data: 'Staging file...',
          final: false
        })
      const newAppManifest = await stageAppFile({ filePath, releaseMeta, reply })

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
        Logger.log(LOGGING_LEVELS.ERROR, `[store.addApp]: ${e.message}`)
        reply &&
          reply('logging', {
            status: false,
            data: 'Unable to stage app',
            error: e.message,
            final: true
          })
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, `[store.addApp]: Unknown error ` + String(e))
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
    const { getIcon } = await import('../services/apps/appUtils')
    return await getIcon(appName, icon)
  }
}

export default AppStore.getInstance()

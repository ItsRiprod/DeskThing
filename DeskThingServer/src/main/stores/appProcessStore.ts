import {
  AppProcessEvents,
  AppProcessEventListener,
  AppProcessListener,
  AppProcessStoreClass,
  AppDataFilters
} from '@shared/stores/appProcessStore'
import { App, AppProcessData, SEND_TYPES, ToAppProcess, ToServerData } from '@DeskThing/types'
import appProcessPath from '@utilities/appProcess?modulePath'
import { app /*, utilityProcess */ } from 'electron'
import { Worker } from 'node:worker_threads'
import Logger from '@server/utils/logger'
import { dirname, join } from 'node:path'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { translateLegacyTypeRequest } from '@server/services/apps/legacyAppComs'
import { coerce, lt } from 'semver'

export class AppProcessStore implements AppProcessStoreClass {
  private processes: Record<
    string,
    {
      process: Worker //Electron.UtilityProcess
    }
  > = {}

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  private processEventListeners: Record<AppProcessEvents, AppProcessEventListener[]> = {
    [AppProcessEvents.STARTED]: [],
    [AppProcessEvents.STOPPED]: [],
    [AppProcessEvents.RUNNING]: [],
    [AppProcessEvents.ERROR]: [],
    [AppProcessEvents.EXITED]: []
  }

  // Required by all stores. There is nothing
  initialize(): Promise<void> {
    if (this._initialized) return Promise.resolve()
    this._initialized = true
    return Promise.resolve()
  }

  private messageListeners: Partial<{
    [key in SEND_TYPES]: Array<{ listener: AppProcessListener<key>; filters?: AppDataFilters<key> }>
  }> = {}

  async postMessage(appName: string, data: ToAppProcess): Promise<void> {
    if (!this.processes[appName]) {
      throw new Error(`Process ${appName} not found`)
    }
    this.processes[appName].process.postMessage(data)
  }

  onProcessEvent(type: AppProcessEvents, callback: AppProcessEventListener): () => void {
    this.processEventListeners[type].push(callback)
    return () => {
      this.processEventListeners[type] = this.processEventListeners[type].filter(
        (listener) => listener !== callback
      )
    }
  }

  notifyProcessEvent(type: AppProcessEvents, appName: string, cause?: string): void {
    Logger.debug(`Process ${appName} is emitting ${type}`, {
      source: 'AppProcessStore',
      function: 'notifyProcessEvent'
    })
    this.processEventListeners[type].forEach((listener) => listener(appName, cause))
  }

  onMessage<T extends SEND_TYPES>(
    type: T,
    listener: AppProcessListener<T>,
    filters?: AppDataFilters<T>
  ): () => void {
    if (!this.messageListeners[type]) {
      this.messageListeners[type] = []
    }

    this.messageListeners[type].push({ listener, filters })
    return () => this.offMessage(type, listener)
  }

  offMessage<T extends SEND_TYPES>(type: T, listener: AppProcessListener<T>): void {
    if (this.messageListeners[type]) {
      this.messageListeners[type] = this.messageListeners[type].filter(
        (entry) => entry.listener !== listener
      ) as []
    }
  }

  notifyMessageListeners<T extends SEND_TYPES>(
    type: T,
    data: Extract<ToServerData, { type: T }> & { source: string; legacy?: boolean }
  ): void {
    Logger.debug(
      `Notifying listeners for ${type} from ${data.source}: ${data.type}:${data.request}`,
      {
        source: 'AppProcessStore',
        function: 'notifyMessageListeners'
      }
    )
    const listeners = this.messageListeners[type]
    if (listeners) {
      listeners.forEach((entry) => {
        const { listener, filters } = entry
        if (filters) {
          if (filters.request && data.request != filters.request) {
            return
          }

          if (filters.app && data.source !== filters.app) {
            return
          }
        }

        listener(data)
      })
    }
  }

  getActiveProcessIds(): string[] {
    return Object.keys(this.processes)
  }
  private async getAppPath(appName: string): Promise<string> {
    const possiblePaths = [
      'index.js',
      'index.mjs',
      'index.cjs',
      'server/index.js',
      'server/index.mjs',
      'server/index.cjs'
    ]

    const appPath = join(app.getPath('userData'), 'apps', appName)

    for (const path of possiblePaths) {
      const fullPath = join(appPath, path)
      try {
        await stat(fullPath)
        return fullPath
      } catch {
        // do nothing
      }
    }

    throw new Error(
      `Entry point for app ${appName} not found. (Does it have an index.js file in root or server directory?)`
    )
  }

  /**
   * Handles the spawning and message handling of a process
   * @param appName The name of the app to spawn
   * @returns True if the process was spawned, false if it already exists
   * @version 0.11.0
   */
  async spawnProcess(app: App): Promise<boolean> {
    try {
      if (this.processes[app.name]) {
        Logger.warn(`Process ${app.name} already exists`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })
        return false
      }

      const deskthingUrl = await this.getAppPath(app.name)

      // True if the required server version is greater than 0.11.0
      const satisfiesVersion = lt(
        '0.10.9',
        coerce(app.manifest?.requiredVersions.server)?.version || '0.0.0'
      )

      if (satisfiesVersion) {
        // This means the app can use the new import
        Logger.debug(`App ${app.name} is using the new import method. Importing directly`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })
        try {
          // Assert the type to module
          await this.assertModuleType(deskthingUrl)
          const process = new Worker(deskthingUrl, {
            stdout: true,
            stderr: true,
            env: {
              DESKTHING_URL: deskthingUrl,
              DESKTHING_APP_NAME: app.name
            },
            name: `DeskThing ${app.name} App`
          })

          this.processes[app.name] = {
            process
          }
        } catch (error) {
          this.notifyProcessEvent(
            AppProcessEvents.ERROR,
            app.name,
            `Error spawning ${app.name} process: ${(error as Error).message}`
          )
          return false
        }
      } else {
        const process = new Worker(appProcessPath, {
          stdout: true,
          stderr: true,
          env: {
            DESKTHING_URL: deskthingUrl,
            DESKTHING_APP_NAME: app.name
          },
          name: `DeskThing ${app.name} App`
        })

        this.processes[app.name] = {
          process
        }
      }

      this.processes[app.name].process.stdout?.on('data', (data) => {
        Logger.info(`${data.toString().trim()}`, {
          domain: app.name.toUpperCase()
        })
      })

      this.processes[app.name].process.stderr?.on('data', (data) => {
        Logger.error(`${data.toString().trim()}`, {
          domain: app.name.toUpperCase()
        })
      })

      this.processes[app.name].process.on('message', (data: AppProcessData) => {
        this.handleProcessMessage(app.name, data)
      })

      this.processes[app.name].process.on('online', () => {
        this.notifyProcessEvent(AppProcessEvents.STARTED, app.name)
      })

      this.processes[app.name].process.on('exit', (code) => {
        Logger.warn(`Process ${app.name} exited with code: ${code}`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })

        if (code !== 0) {
          Logger.error(`Process ${app.name} exited with non-zero code: ${code}`, {
            source: 'AppProcessStore',
            function: 'spawnProcess'
          })

          this.notifyProcessEvent(
            AppProcessEvents.ERROR,
            app.name,
            `Process exited with code ${code}`
          )
        }

        this.notifyProcessEvent(AppProcessEvents.STOPPED, app.name)
        this.notifyProcessEvent(AppProcessEvents.EXITED, app.name, `exited with code ${code}`)
        delete this.processes[app.name]
      })

      this.processes[app.name].process.on('error', (error) => {
        Logger.error(`Process ${app.name} encountered an error`, {
          source: 'AppProcessStore',
          function: 'spawnProcess',
          error: error instanceof Error ? error : new Error(String(error))
        })
        this.notifyProcessEvent(AppProcessEvents.ERROR, app.name, error.message)
      })

      return true
    } catch (error) {
      Logger.error(`Failed to spawn process for ${app.name}: ${error}`, {
        source: 'AppProcessStore',
        function: 'spawnProcess',
        error: error as Error
      })

      this.notifyProcessEvent(
        AppProcessEvents.ERROR,
        app.name,
        error instanceof Error ? error.message : String(error)
      )
      return false
    }
  }

  private async assertModuleType(appPath: string): Promise<boolean> {
    // Skip for .mjs and .cjs files as they are already typed
    if (appPath.endsWith('.mjs') || appPath.endsWith('.cjs')) {
      return false
    }

    try {
      // Check if there's a package.json file
      const packageJsonPath = join(dirname(appPath), 'package.json')

      try {
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(packageJsonContent)

        if (!packageJson.type) {
          packageJson.type = 'module'
          await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
        }
        return true
      } catch {
        // No package.json, create one with type: module
        const newPackageJson = { type: 'module' }
        await writeFile(packageJsonPath, JSON.stringify(newPackageJson, null, 2))
        return true
      }
    } catch (error) {
      Logger.error(`Failed to determine module type for ${appPath}`, {
        source: 'AppProcessStore',
        function: 'isModuleType',
        error: error instanceof Error ? error : new Error(String(error))
      })
      return false
    }
  }
  /**
   * The version that this process handler is built for minus one for lt to work
   */
  private version = '0.11.0'
  /**
   * Handles the message received from a process
   * @param appName The name of the app the message is from
   * @param data The message data
   * @version 0.11.0
   */
  private async handleProcessMessage(appName: string, data: AppProcessData): Promise<void> {
    if (lt(data.version, this.version)) {
      Logger.debug(
        `Received message from outdated app ${appName} (because ${data.version} < ${this.version})`,
        {
          source: 'AppProcessStore',
          function: 'handleProcessMessage'
        }
      )
      this.handleLegacyProcessMessage(appName, data)
      return
    }

    switch (data.type) {
      case 'data':
        this.notifyMessageListeners(data.payload.type as SEND_TYPES, {
          ...(data.payload as Extract<ToServerData, { type: typeof data.payload.type }>['payload']),
          source: appName
        })
        break
      case 'started':
        this.notifyProcessEvent(AppProcessEvents.RUNNING, appName)
        break
      case 'stopped':
        this.notifyProcessEvent(AppProcessEvents.STOPPED, appName)
        break
      case 'server:error':
        this.notifyProcessEvent(AppProcessEvents.ERROR, appName, data.payload.message)
        break
      case 'server:log':
        Logger.log(data.payload.level, data.payload.message, data.payload)
        break
      default:
        Logger.warn(`Received unknown message type '${String(data)}' from ${appName}`, {
          source: 'AppProcessStore',
          function: 'handleProcessMessage'
        })
        break
    }
  }

  private async handleLegacyProcessMessage(appName: string, data: unknown): Promise<void> {
    if (!isAppProcessData(data)) {
      Logger.warn(`Received unknown message type '${String(data)}' from ${appName}`, {
        source: 'AppProcessStore',
        function: 'handleLegacyProcessMessage'
      })
      return
    }

    switch (data.type) {
      case 'data':
        {
          const { type, request } = translateLegacyTypeRequest(
            data.payload.type,
            data.payload.request
          )
          Logger.debug(
            `Translated legacy ${data.payload.type}:${data.payload.request} to ${type}:${request}`,
            {
              source: 'AppProcessStore',
              function: 'handleLegacyProcessMessage'
            }
          )
          Logger.debug(JSON.stringify(data.payload.payload))
          this.notifyMessageListeners(type as SEND_TYPES, {
            ...({ type, request, payload: data.payload.payload, legacy: true } as Extract<
              ToServerData,
              { type: typeof type }
            >['payload']),
            source: appName
          })
        }
        break
      case 'started':
        this.notifyProcessEvent(AppProcessEvents.RUNNING, appName)
        break
      case 'stopped':
        this.notifyProcessEvent(AppProcessEvents.STOPPED, appName)
        break
      case 'server:error':
        this.notifyProcessEvent(AppProcessEvents.ERROR, appName, data.payload.message)
        break
      case 'server:log':
        Logger.log(data.payload.level, data.payload.message, data.payload)
        break
      default:
        Logger.warn(`Received unknown message type '${String(data)}' from ${appName}`, {
          source: 'AppProcessStore',
          function: 'handleLegacyProcessMessage'
        })
        break
    }
  }

  async terminateProcess(appName: string): Promise<boolean> {
    try {
      Logger.debug(`Terminating process ${appName}`, {
        source: 'AppProcessStore',
        function: 'terminateProcess'
      })
      if (!this.processes[appName]) {
        return false
      }

      this.processes[appName].process.terminate()
      delete this.processes[appName]
      return true
    } catch (error) {
      Logger.error(`Failed to terminate process ${appName}: ${error}`, {
        source: 'AppProcessStore',
        function: 'terminateProcess'
      })
      return false
    }
  }
}

function isAppProcessData(data: unknown): data is AppProcessData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof data.type === 'string' &&
    'payload' in data &&
    typeof data.payload === 'object' &&
    data.payload !== null
  )
}

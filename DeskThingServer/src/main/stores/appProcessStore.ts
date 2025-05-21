import {
  AppProcessTypes,
  AppProcessStoreClass,
  AppProcessEvents
} from '@shared/stores/appProcessStore'
import {
  App,
  AppProcessData,
  APP_REQUESTS,
  DeskThingProcessData,
  AppToDeskThingData
} from '@deskthing/types'
import appProcessPath from '@processes/appProcess?modulePath'
import { app /*, utilityProcess */ } from 'electron'
import { Worker } from 'node:worker_threads'
import Logger from '@server/utils/logger'
import { dirname, join } from 'node:path'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { translateLegacyTypeRequest } from '@server/services/apps/legacyAppComs'
import { coerce, lt } from 'semver'
import { EventEmitter } from 'node:events'
import { handleError } from '@server/utils/errorHandler'

export class AppProcessStore
  extends EventEmitter<AppProcessEvents>
  implements AppProcessStoreClass
{
  private processes: Record<
    string,
    {
      process: Worker //Electron.UtilityProcess
    }
  > = {}

  constructor() {
    super()
  }

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  // Required by all stores. There is nothing
  initialize(): Promise<void> {
    if (this._initialized) return Promise.resolve()
    this._initialized = true
    return Promise.resolve()
  }

  async postMessage(appName: string, data: DeskThingProcessData): Promise<void> {
    if (!this.processes[appName]) {
      Logger.warn(`Tried to send message to app ${appName} but it wasn't found or is not running`, {
        source: 'AppProcessStore',
        function: 'postMessage'
      })
      return
    }
    this.processes[appName].process.postMessage(data)
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
      `Entry point for app ${appName} not found. (Does it have an index file in root or server directory?)`
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

      let process: Worker

      if (satisfiesVersion) {
        // This means the app can use the new import
        Logger.debug(`App ${app.name} is using the new import method. Importing directly`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })
        try {
          // Assert the type to module
          await this.assertModuleType(deskthingUrl)

          process = new Worker(deskthingUrl, {
            stdout: true,
            stderr: true,
            env: {
              DESKTHING_URL: deskthingUrl,
              DESKTHING_APP_NAME: app.name
            },
            name: `DeskThing ${app.name} App`
          })
        } catch (error) {
          Logger.debug(`Error spawning ${app.name} process}`, {
            source: 'AppProcessStore',
            function: 'spawnProcess',
            error: error as Error
          })
          this.emit(AppProcessTypes.ERROR, app.name)
          return false
        }
      } else {
        Logger.debug(`App ${app.name} is using the old import method because $. Spawning process`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })

        process = new Worker(appProcessPath, {
          stdout: true,
          stderr: true,
          env: {
            DESKTHING_URL: deskthingUrl,
            DESKTHING_APP_NAME: app.name
          },
          name: `DeskThing ${app.name} App`
        })
      }

      this.processes[app.name] = {
        process
      }

      this.setupProcessLogging(app.name, process)

      this.setupProcessMessageHandling(app.name, process)

      this.setupProcessErrorHandling(app.name, process)

      return true
    } catch (error) {
      Logger.error(`Failed to spawn process for ${app.name}: ${error}`, {
        source: 'AppProcessStore',
        function: 'spawnProcess',
        error: error as Error
      })

      this.emit(AppProcessTypes.ERROR, app.name)
      return false
    }
  }

  private setupProcessErrorHandling(appName: string, process: Worker): void {
    // Handle uncaught exceptions in the worker thread
    process.on('error', (error) => {
      Logger.error(`Process ${appName} encountered the error: ${handleError(error)}`, {
        source: 'AppProcessStore',
        function: 'spawnProcess',
        error: error instanceof Error ? error : new Error(handleError(error))
      })

      // Just emit the error event but don't let it propagate up
      this.emit(AppProcessTypes.ERROR, appName)

      // Attempt to gracefully terminate the process
      try {
        this.terminateProcess(appName).catch((err) => {
          Logger.error(`Failed to terminate process ${appName} after error ${handleError(err)}`, {
            source: 'AppProcessStore',
            function: 'setupProcessErrorHandling',
            error: err instanceof Error ? err : new Error(handleError(err))
          })
        })
      } catch (terminateError) {
        // Ensure termination errors don't propagate either
        Logger.error(`Error during termination of process ${appName}`, {
          source: 'AppProcessStore',
          function: 'setupProcessErrorHandling',
          error:
            terminateError instanceof Error ? terminateError : new Error(String(terminateError))
        })
      }
    })

    // Handle process exit
    process.on('exit', (code) => {
      Logger.warn(`Process ${appName} exited with code: ${code}`, {
        source: 'AppProcessStore',
        function: 'spawnProcess'
      })

      if (code !== 0) {
        Logger.error(`Process ${appName} exited with non-zero code: ${code}`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })

        this.emit(AppProcessTypes.ERROR, appName)
      }

      this.emit(AppProcessTypes.STOPPED, appName)
      this.emit(AppProcessTypes.EXITED, appName)

      // Safely remove the process from our tracking
      try {
        delete this.processes[appName]
      } catch (error) {
        Logger.error(`Error cleaning up process ${appName}`, {
          source: 'AppProcessStore',
          function: 'setupProcessErrorHandling',
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    })
  }

  private setupProcessLogging(appName: string, process: Worker): void {
    process.stdout?.on('data', (data) => {
      try {
        Logger.info(`${data.toString().trim()}`, {
          domain: appName.toUpperCase()
        })
      } catch (error) {
        // Ensure logging errors don't propagate
        Logger.error(`Error logging stdout from ${appName}`, {
          source: 'AppProcessStore',
          function: 'setupProcessLogging',
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    })

    process.stderr?.on('data', (data) => {
      try {
        Logger.error(`${data.toString().trim()}`, {
          domain: appName.toUpperCase()
        })
      } catch (error) {
        // Ensure logging errors don't propagate
        Logger.error(`Error logging stderr from ${appName}`, {
          source: 'AppProcessStore',
          function: 'setupProcessLogging',
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    })
  }

  private setupProcessMessageHandling(appName: string, process: Worker): void {
    process.on('message', (data: AppProcessData) => {
      try {
        this.handleProcessMessage(appName, data)
      } catch (error) {
        // Ensure message handling errors don't propagate
        Logger.error(`Error handling message from ${appName}`, {
          source: 'AppProcessStore',
          function: 'setupProcessMessageHandling',
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    })

    process.on('online', () => {
      try {
        this.emit(AppProcessTypes.STARTED, appName)
      } catch (error) {
        Logger.error(`Error emitting STARTED event for ${appName}`, {
          source: 'AppProcessStore',
          function: 'setupProcessMessageHandling',
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    })
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

        packageJson.type = 'module'
        await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
        Logger.debug(`Updated package.json for ${appPath}`, {
          source: 'AppProcessStore',
          function: 'assertModuleType'
        })
        return true
      } catch {
        // No package.json, create one with type: module
        const newPackageJson = { type: 'module' }
        Logger.debug(`Creating package.json for ${appPath}`, {
          source: 'AppProcessStore',
          function: 'assertModuleType'
        })
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
    try {
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
          this.emit(data.payload.type, {
            ...data.payload,
            source: appName
          } as Extract<AppToDeskThingData, { type: typeof data.payload.type; source: string }>)
          break
        case 'started':
          this.emit(AppProcessTypes.RUNNING, appName)
          break
        case 'stopped':
          this.emit(AppProcessTypes.STOPPED, appName)
          break
        case 'server:error':
          Logger.error(data.payload.message, {
            source: 'AppProcessStore',
            function: 'handleProcessMessage',
            error: data.payload
          })
          this.emit(AppProcessTypes.ERROR, appName)
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
    } catch (error) {
      Logger.error(`Unhandled error processing message from ${appName}`, {
        source: 'AppProcessStore',
        function: 'handleProcessMessage',
        error: error instanceof Error ? error : new Error(String(error))
      })
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
          Logger.debug(JSON.stringify(data.payload.payload), {
            domain: appName,
            function: 'handleLegacyProcessMessage',
            source: 'AppProcessStore'
          })
          this.emit(
            type as APP_REQUESTS,
            {
              type,
              request,
              source: appName,
              payload: data.payload.payload,
              legacy: true
            } as Extract<AppToDeskThingData, { type: typeof type; source: string }>
          )
        }
        break
      case 'started':
        this.emit(AppProcessTypes.RUNNING, appName)
        break
      case 'stopped':
        this.emit(AppProcessTypes.STOPPED, appName)
        break
      case 'server:error':
        Logger.error(data.payload.message, {
          source: 'AppProcessStore',
          function: 'handleProcessMessage',
          error: data.payload
        })
        this.emit(AppProcessTypes.ERROR, appName)
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

      try {
        // First try to gracefully terminate
        this.processes[appName].process.terminate()
      } catch (terminateError) {
        Logger.error(`Error during termination of process ${appName}`, {
          source: 'AppProcessStore',
          function: 'terminateProcess',
          error:
            terminateError instanceof Error ? terminateError : new Error(String(terminateError))
        })
      } finally {
        // Always clean up our reference, even if termination failed
        delete this.processes[appName]
      }

      return true
    } catch (error) {
      Logger.error(`Failed to terminate process ${appName}`, {
        source: 'AppProcessStore',
        function: 'terminateProcess',
        error: error instanceof Error ? error : new Error(String(error))
      })

      // Try to clean up anyway
      try {
        delete this.processes[appName]
      } catch (cleanupError) {
        // Just log, don't throw
        Logger.error(`Failed to clean up process reference for ${appName}`, {
          source: 'AppProcessStore',
          function: 'terminateProcess',
          error: cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError))
        })
      }

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

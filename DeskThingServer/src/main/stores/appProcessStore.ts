import {
  AppProcessEvents,
  AppProcessEventListener,
  AppProcessListener,
  AppProcessStoreClass,
  FAppProcessPayload,
  TAppProcessPayload,
  AppDataFilters
} from '@shared/stores/appProcessStore'
import { SEND_TYPES, ToServerData } from '@DeskThing/types'
import appProcessPath from '@utilities/appProcess?modulePath'
import { app, utilityProcess } from 'electron'
import Logger from '@server/utils/logger'
import { join } from 'node:path'
import { stat } from 'node:fs/promises'

export class AppProcessStore implements AppProcessStoreClass {
  private processes: Record<
    string,
    {
      process: Electron.UtilityProcess
    }
  > = {}
  private processEventListeners: Record<AppProcessEvents, AppProcessEventListener[]> = {
    [AppProcessEvents.STARTED]: [],
    [AppProcessEvents.STOPPED]: [],
    [AppProcessEvents.RUNNING]: [],
    [AppProcessEvents.ERROR]: [],
    [AppProcessEvents.EXITED]: []
  }
  private messageListeners: Partial<{
    [key in SEND_TYPES]: Array<{ listener: AppProcessListener<key>; filters?: AppDataFilters<key> }>
  }> = {}

  async postMessage(appName: string, data: TAppProcessPayload): Promise<void> {
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
    Logger.info(`Process ${appName} is emitting ${type}`, {
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
    data: Extract<ToServerData, { type: T }> & { source: string }
  ): void {
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

  async spawnProcess(appName: string): Promise<boolean> {
    try {
      if (this.processes[appName]) {
        Logger.warn(`Process ${appName} already exists`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })
        return false
      }

      const deskthingUrl = await this.getAppPath(appName)
      const process = utilityProcess.fork(appProcessPath, [], {
        stdio: 'pipe',
        serviceName: `DeskThing ${appName} App`,
        allowLoadingUnsignedLibraries: true,
        env: {
          DESKTHING_URL: deskthingUrl,
          DESKTHING_APP_NAME: appName,
          NODE_DNS_SERVER_1: '8.8.8.8',  // Google DNS
          NODE_DNS_SERVER_2: '1.1.1.1'
        }
      })

      process.stdout?.on('data', (data) => {
        Logger.info(`${data.toString().trim()}`, {
          domain: appName.toUpperCase()
        })
      })

      process.stderr?.on('data', (data) => {
        Logger.error(`${data.toString().trim()}`, {
          domain: appName.toUpperCase()
        })
      })

      this.processes[appName] = {
        process
      }

      process.on('message', (data: FAppProcessPayload) => {
        if (!data || !data.type) {
          Logger.warn(`Received invalid message from ${appName}`, {
            source: 'AppProcessStore',
            function: 'processMessage'
          })
          return
        }

        switch (data.type) {
          case 'data':
            this.notifyMessageListeners(data.payload.type as SEND_TYPES, {
              ...(data.payload as Extract<
                ToServerData,
                { type: typeof data.payload.type }
              >['payload']),
              source: appName
            })
            break
          case 'start':
            this.notifyProcessEvent(AppProcessEvents.RUNNING, appName)
            break
          case 'server:error':
            this.notifyProcessEvent(AppProcessEvents.ERROR, appName, data.payload.message)
            break
          case 'server:log':
            Logger.log(data.payload.type, data.payload.log, data.payload.options)
            break
          default:
            Logger.info(`Received unknown message type '${String(data)}' from ${appName}`, {
              source: 'AppProcessStore',
              function: 'processMessage'
            })
            break
        }
      })

      process.on('spawn', () => {
        this.notifyProcessEvent(AppProcessEvents.STARTED, appName)
      })

      process.on('exit', (code) => {
        Logger.info(`Process ${appName} exited with code: ${code}`, {
          source: 'AppProcessStore',
          function: 'spawnProcess'
        })

        if (code !== 0) {
          Logger.error(`Process ${appName} exited with non-zero code: ${code}`, {
            source: 'AppProcessStore',
            function: 'spawnProcess'
          })

          this.notifyProcessEvent(
            AppProcessEvents.ERROR,
            appName,
            `Process exited with code ${code}`
          )
        }

        this.notifyProcessEvent(AppProcessEvents.STOPPED, appName)
        this.notifyProcessEvent(AppProcessEvents.EXITED, appName, `exited with code ${code}`)
        delete this.processes[appName]
      })

      process.on('error', (error) => {
        Logger.error(`Process ${appName} encountered an error`, {
          source: 'AppProcessStore',
          function: 'spawnProcess',
          error: new Error(error)
        })
        this.notifyProcessEvent(AppProcessEvents.ERROR, appName, error)
      })

      return true
    } catch (error) {
      Logger.error(`Failed to spawn process for ${appName}: ${error}`, {
        source: 'AppProcessStore',
        function: 'spawnProcess',
        error: error as Error
      })

      this.notifyProcessEvent(
        AppProcessEvents.ERROR,
        appName,
        error instanceof Error ? error.message : String(error)
      )
      return false
    }
  }

  async terminateProcess(appName: string): Promise<boolean> {
    try {
      Logger.info(`Terminating process ${appName}`, {
        source: 'AppProcessStore',
        function: 'terminateProcess'
      })
      if (!this.processes[appName]) {
        return false
      }

      this.processes[appName].process.kill()
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

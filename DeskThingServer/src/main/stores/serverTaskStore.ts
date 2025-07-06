import { TaskStoreClass } from '@shared/stores/taskStore'
import { ClientStoreClass } from '@shared/stores/clientStore'
import { ServerTasks } from '../static/defaultTasks'
import { PlatformStoreClass, PlatformStoreEvent } from '@shared/stores/platformStore'
import { ServerTaskStoreClass } from '@shared/stores/serverTaskStore'

export class ServerTaskStore implements ServerTaskStoreClass {
  private taskStore: TaskStoreClass
  private platformStore: PlatformStoreClass
  private clientStore: ClientStoreClass
  private _initialized: boolean = false

  get initialized(): boolean {
    return this._initialized
  }

  readonly autoInit = true
  constructor(
    taskStore: TaskStoreClass,
    clientStore: ClientStoreClass,
    platformStore: PlatformStoreClass
  ) {
    this.taskStore = taskStore
    this.clientStore = clientStore
    this.platformStore = platformStore
  }

  // Implements cachable store - there is no state, so there is no caching necessary
  clearCache = async (): Promise<void> => {}
  saveToFile = async (): Promise<void> => {}

  async initialize(): Promise<void> {
    if (this.initialized) return
    await this.initializeListeners()
    await this.initializeServerTasks()
    this._initialized = true
  }

  private async initializeServerTasks(): Promise<void> {
    await this.taskStore.addTasks('server', ServerTasks)
  }

  private async initializeListeners(): Promise<void> {
    // Listen for client installation/updates
    this.clientStore.on('client-updated', async (client) => {
      if (client.meta?.updateAvailable) {
        await this.taskStore.startTask('server', 'updateClient')
      }

      // Check if the client is installed
      const clientTask = await this.taskStore.getTask('server', 'client')
      if (!clientTask?.completed) {
        await this.taskStore.completeStep('server', 'client', 'download')
        await this.taskStore.completeStep('server', 'client', 'refresh')
      }
    })

    // Monitor device setup progress
    this.platformStore.on(PlatformStoreEvent.CLIENT_LIST, async (clients) => {
      const adbClients = clients.filter((c) => c.identifiers.adb)

      if (adbClients.length > 0) {
        const deviceTask = await this.taskStore.getTask('server', 'device')
        if (deviceTask && !deviceTask.completed) {
          const configuredClients = adbClients.filter((c) => c.connected)

          // Must be configured if the device is connected
          if (configuredClients.length > 0) {
            await this.taskStore.completeStep('server', 'device', 'configure')
          }

          await this.taskStore.completeStep('server', 'device', 'detect')
        }
      }
    })
  }
}

// Store Classes
import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { releaseStoreClass } from '@shared/stores/releaseStore'
import { MappingStoreClass } from '@shared/stores/mappingStore'
import { MusicStoreClass } from '@shared/stores/musicStore'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { AppProcessStoreClass } from '@shared/stores/appProcessStore'
import { TaskStoreClass } from '@shared/stores/taskStore'
import { PlatformStoreClass } from '@shared/stores/platformStore'
import { AuthStoreClass } from '@shared/stores/authStore'
import { ClientStoreClass } from '@shared/stores/clientStore'
import { UpdateStoreClass } from '@shared/stores/updateStore'

// Stores

// import { ExpressServerStoreClass } from '@shared/stores/expressServerStore'
// import { ExpressServerManager } from './_expressServerStore'
import logger from '@server/utils/logger'

interface Stores {
  appDataStore: AppDataStoreClass
  appProcessStore: AppProcessStoreClass
  appStore: AppStoreClass
  authStore: AuthStoreClass
  clientStore: ClientStoreClass
  releaseStore: releaseStoreClass
  mappingStore: MappingStoreClass
  musicStore: MusicStoreClass
  platformStore: PlatformStoreClass
  settingsStore: SettingsStoreClass
  taskStore: TaskStoreClass
  updateStore: UpdateStoreClass
}

export class StoreProvider {
  private static instance: StoreProvider
  private storeInstances: {
    [K in keyof Stores]?: Stores[K]
  } = {}
  private storeInitializers: {
    [K in keyof Stores]: () => Promise<Stores[K]>
  }
  private initialized = false

  private constructor() {
    const storeImports = {
      appDataStore: () => import('./appDataStore').then((m) => m.AppDataStore),
      appStore: () => import('./appStore').then((m) => m.AppStore),
      authStore: () => import('./authStore').then((m) => m.AuthStore),
      releaseStore: () => import('./releaseStore').then((m) => m.releaseStore),
      mappingStore: () => import('./mappingStore').then((m) => m.MappingStore),
      musicStore: () => import('./musicStore').then((m) => m.MusicStore),
      settingsStore: () => import('./settingsStore').then((m) => m.SettingsStore),
      taskStore: () => import('./taskStore').then((m) => m.TaskStore),
      appProcessStore: () => import('./appProcessStore').then((m) => m.AppProcessStore),
      platformStore: () => import('./platformStore').then((m) => m.PlatformStore),
      clientStore: () => import('./clientStore').then((m) => m.ClientStore),
      updateStore: () => import('./updateStore').then((m) => m.UpdateStore)
    }

    this.storeInitializers = {
      settingsStore: async () => new (await storeImports.settingsStore())(),
      appProcessStore: async () => new (await storeImports.appProcessStore())(),
      authStore: async () =>
        new (await storeImports.authStore())(await this.getStore('settingsStore', false)),
      appStore: async () =>
        new (await storeImports.appStore())(
          await this.getStore('appProcessStore', false),
          await this.getStore('authStore', false)
        ),
      appDataStore: async () =>
        new (await storeImports.appDataStore())(await this.getStore('appStore', false)),
      platformStore: async () =>
        new (await storeImports.platformStore())(
          await this.getStore('appStore', false),
          await this.getStore('appDataStore', false),
          await this.getStore('mappingStore', false)
        ),
      taskStore: async () =>
        new (await storeImports.taskStore())(
          await this.getStore('appDataStore', false),
          await this.getStore('appStore', false)
        ),
      releaseStore: async () => new (await storeImports.releaseStore())(),
      mappingStore: async () =>
        new (await storeImports.mappingStore())(await this.getStore('appStore', false)),
      musicStore: async () =>
        new (await storeImports.musicStore())(
          await this.getStore('settingsStore', false),
          await this.getStore('appStore', false),
          await this.getStore('platformStore', false)
        ),
      clientStore: async () => new (await storeImports.clientStore())(),
      updateStore: async () => new (await storeImports.updateStore())()
    }

    this.initialize()
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return
    const settingStore = await this.getStore('settingsStore')
    logger.setupSettingsListener(settingStore)
    logger.info('Initialized initial stores', {
      function: 'initializeInitialStores',
      source: 'storeProvider'
    })
  }

  public static getInstance(): StoreProvider {
    if (!StoreProvider.instance) {
      StoreProvider.instance = new StoreProvider()
    }
    return StoreProvider.instance
  }

  public async getStore<K extends keyof Stores>(
    storeName: K,
    initialize = true
  ): Promise<Stores[K]> {
    // Lazy initialize store only when requested
    if (!this.storeInstances[storeName]) {
      this.storeInstances[storeName] = await this.storeInitializers[storeName]()

      // Specifically handle the appDataStore loop
      if (storeName == 'appDataStore') {
        const appDataStore = this.storeInstances[storeName] as Stores['appDataStore']
        appDataStore.setupListeners(await this.getStore('taskStore', false))
      }
    }

    if (!this.storeInstances[storeName].initialized && initialize) {
      // Ensure the store is initialized before returning it
      logger.info(`Initializing ${storeName}`, {
        function: 'getStore',
        source: 'storeProvider'
      })
      await this.storeInstances[storeName].initialize()
    }
    return this.storeInstances[storeName] as Stores[K]
  }

  public async clearAllCaches(): Promise<void> {
    await Promise.all(
      Object.values(this.storeInstances).map((store) =>
        'clearCache' in store ? store.clearCache() : Promise.resolve()
      )
    )
  }

  public async saveAllToFile(): Promise<void> {
    await Promise.all(
      Object.values(this.storeInstances).map((store) =>
        'saveToFile' in store ? store.saveToFile() : Promise.resolve()
      )
    )
  }
}

export const storeProvider = StoreProvider.getInstance()

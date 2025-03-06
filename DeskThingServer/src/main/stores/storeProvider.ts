import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { ConnectionStoreClass } from '@shared/stores/connectionsStore'
import { GithubStoreClass } from '@shared/stores/githubStore'
import { MappingStoreClass } from '@shared/stores/mappingStore'
import { MusicStoreClass } from '@shared/stores/musicStore'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { TaskStoreClass } from '@shared/stores/taskStore'
import { AppDataStore } from './appDataStore'
import { AppStore } from './appStore'
import { ConnectionStore } from './connectionsStore'
import { GithubStore } from './githubStore'
import { MappingStore } from './mappingStore'
import { MusicStore } from './musicStore'
import { SettingsStore } from './settingsStore'
import { TaskStore } from './taskStore'
import { AppProcessStore } from './appProcessStore'
import { AppProcessStoreClass } from '@shared/stores/appProcessStore'
import { PlatformStoreClass } from '@shared/stores/platformStore'
import { PlatformStore } from './platformStore'
// import { ExpressServerStoreClass } from '@shared/stores/expressServerStore'
// import { ExpressServerManager } from './_expressServerStore'
import logger from '@server/utils/logger'

interface Stores {
  settingsStore: SettingsStoreClass
  taskStore: TaskStoreClass
  appStore: AppStoreClass
  appDataStore: AppDataStoreClass
  connectionsStore: ConnectionStoreClass
  githubStore: GithubStoreClass
  mappingStore: MappingStoreClass
  musicStore: MusicStoreClass
  appProcessStore: AppProcessStoreClass
  platformStore: PlatformStoreClass
  // expressServerStore: ExpressServerStoreClass
}

export class StoreProvider {
  private static instance: StoreProvider
  private storeInstances: Partial<Stores> = {}
  private storeInitializers: Record<keyof Stores, () => Stores[keyof Stores]>

  private constructor() {
    this.storeInitializers = {
      settingsStore: () => new SettingsStore(),
      appProcessStore: () => new AppProcessStore(),
      appStore: () => new AppStore(this.getStore('appProcessStore')),
      // Circular dependency: appDataStore depends on taskStore and taskStore depends on appDataStore
      appDataStore: () => new AppDataStore(this.getStore('appStore')),
      platformStore: () => new PlatformStore(this.getStore('appStore')),
      // Circular dependency: taskStore depends on appDataStore which depends on taskStore above
      taskStore: () => new TaskStore(this.getStore('appDataStore'), this.getStore('appStore')),
      connectionsStore: () =>
        new ConnectionStore(
          this.getStore('settingsStore'),
          this.getStore('taskStore'),
          this.getStore('platformStore')
        ),
      // expressServerStore: () =>
      //   new ExpressServerManager(this.getStore('settingsStore'), this.getStore('appStore')),
      githubStore: () => new GithubStore(),
      mappingStore: () => new MappingStore(this.getStore('appStore')),
      musicStore: () => new MusicStore(this.getStore('settingsStore'), this.getStore('appStore'))
    }

    this.initializeInitialStores()
  }

  private initializeInitialStores = (): void => {
    const settingStore = this.getStore('settingsStore')
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

  public getStore<K extends keyof Stores>(storeName: K): Stores[K] {
    // Lazy initialize store only when requested
    if (!this.storeInstances[storeName]) {
      this.storeInstances[storeName] = this.storeInitializers[storeName]() as Stores[K]

      if (storeName === 'appDataStore') {
        const appDataStore = this.storeInstances.appDataStore as AppDataStoreClass
        appDataStore.setupListeners(this.getStore('taskStore'))
      }
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
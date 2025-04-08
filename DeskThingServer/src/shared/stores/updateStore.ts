/**
 * Store for managing application updates
 */

import { StoreInterface } from '@shared/interfaces/storeInterface'
import { EventEmitter } from 'node:events'
import { CacheableStore, UpdateInfoType, UpdateProgressType } from '@shared/types'

/** Listener types for update events */
export type UpdateStoreEvents = {
  'update-status': [UpdateInfoType]
  'update-progress': [UpdateProgressType]
  'update-error': [string]
}

/** Main UpdateStore interface defining all available methods */
export interface UpdateStoreClass
  extends StoreInterface,
    CacheableStore,
    EventEmitter<UpdateStoreEvents> {
  checkForUpdates(): Promise<void>
  startDownload(): Promise<void>
  quitAndInstall(): void
  getUpdateStatus(): UpdateInfoType | null
  getUpdateProgress(): UpdateProgressType | null
}

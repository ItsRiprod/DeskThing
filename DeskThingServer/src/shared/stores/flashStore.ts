import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'
import EventEmitter from 'node:events'
import type { FlashEvent } from 'flashthing'

export type FlashStoreEvents = {
  'flash-started': [string]
  'flash-completed': [string]
  'flash-event': [FlashEvent]
  'flash-failed': [string, Error]
}

export interface FlashStoreClass
  extends CacheableStore,
    EventEmitter<FlashStoreEvents>,
    StoreInterface {
  startFlash(devicePath: string): Promise<void>
  cancelFlash(): Promise<void>
  getFlashStatus(): Promise<FlashEvent | null>
  getFlashSteps(): Promise<number | null>
}

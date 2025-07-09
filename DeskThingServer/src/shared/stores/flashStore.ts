import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore, FlashingState } from '@shared/types'
import EventEmitter from 'node:events'

export type FlashStoreEvents = {
  'flash-state': [FlashingState]
  'total-steps': [number]
  'flash-stopped': [boolean]
}

export interface FlashStoreClass
  extends CacheableStore,
    EventEmitter<FlashStoreEvents>,
    StoreInterface {
  startFlash(imagePath: string): Promise<void>
  configureUSBMode(imagePath: string): Promise<void>
  cancelFlash(): Promise<void>
  getFlashStatus(): Promise<FlashingState | null>
  getFlashSteps(): Promise<number | null>
  configureDriverForDevice(): Promise<void>
}

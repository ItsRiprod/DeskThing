import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'

export interface AutoLaunchStoreClass extends StoreInterface, CacheableStore {
  initialized: boolean
  initialize(): Promise<void>
  enable(): Promise<void>
  disable(): Promise<void>
  isEnabled(): Promise<boolean>
}

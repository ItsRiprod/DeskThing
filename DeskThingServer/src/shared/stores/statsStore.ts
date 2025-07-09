import { StoreInterface } from '@shared/interfaces/storeInterface'
import type { Stats, Registration } from '@shared/types'
import { CacheableStore } from '@shared/types'

export interface StatsStoreClass extends CacheableStore, StoreInterface {
  readonly initialized: boolean
  initialize(): Promise<void>
  clearCache(): Promise<void>
  saveToFile(): Promise<void>
  register(registration: Registration): Promise<void>
  collect(stat: Stats[number]): Promise<void>
  dispose(): void
}

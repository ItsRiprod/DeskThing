import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'

export interface ServerTaskStoreClass extends StoreInterface, CacheableStore {
  readonly autoInit: true
}

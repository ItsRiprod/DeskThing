import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'

/** Main AgentStore interface defining available methods */
export interface AgentStoreClass extends StoreInterface, CacheableStore {
  /** Sets up listeners for agent events */
  setupListeners(): void
}

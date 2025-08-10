import { StoreInterface } from '@shared/interfaces/storeInterface'

export interface TimeStoreClass extends StoreInterface {
  stop(): void
  start(): void
}

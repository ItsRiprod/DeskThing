import { StoreInterface } from '@shared/interfaces/storeInterface'
import EventEmitter from 'node:events'

export type authStoreEventTypes = {
  appData: [{ app: string; callbackData: string }]
}

export interface AuthStoreClass extends EventEmitter<authStoreEventTypes>, StoreInterface {
  handleProtocol: (protocol: string) => Promise<void>
}

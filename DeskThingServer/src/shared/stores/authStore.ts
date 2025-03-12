import EventEmitter from 'node:events'

export type authStoreEventTypes = {
  appData: [{ app: string; callbackData: string }]
}

export interface AuthStoreClass extends EventEmitter<authStoreEventTypes> {
  handleProtocol: (protocol: string) => Promise<void>
}
  
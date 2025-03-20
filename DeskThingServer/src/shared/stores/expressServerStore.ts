import { StoreInterface } from "@shared/interfaces/storeInterface"

export interface ExpressServerStoreClass extends StoreInterface {
  start(): Promise<void>
  stop(): Promise<void>
  sendAppUpdate(apps: any[]): void
}

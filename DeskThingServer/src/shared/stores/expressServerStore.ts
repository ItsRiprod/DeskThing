
export interface ExpressServerStoreClass {
  start(): Promise<void>
  stop(): Promise<void>
  sendAppUpdate(apps: any[]): void
}

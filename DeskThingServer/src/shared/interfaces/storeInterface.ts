export interface StoreInterface {
  initialize(): Promise<void>
  initialized: boolean
}

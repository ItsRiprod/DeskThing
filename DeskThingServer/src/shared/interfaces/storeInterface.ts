export interface StoreInterface {
  readonly autoInit?: boolean
  initialize(): Promise<void>
  initialized: boolean
}
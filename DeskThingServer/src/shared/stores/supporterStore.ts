/**
 * Store for managing supporters data
 */

import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'
import { PaginatedResponse, SupporterData, SupporterFetchOptions } from '@shared/types/supporter'

/** Main SupporterStore interface defining all available methods */
export interface SupporterStoreClass extends StoreInterface, CacheableStore {
  fetchSupporters(opts: SupporterFetchOptions): Promise<PaginatedResponse<SupporterData>>
  clearCache(): Promise<void>
}

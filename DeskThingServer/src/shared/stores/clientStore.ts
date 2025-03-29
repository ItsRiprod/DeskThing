import { ClientManifest } from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'
import EventEmitter from 'node:events'

export type ClientStoreEvents = {
  'client-updated': [ClientManifest]
}

export interface ClientStoreClass
  extends CacheableStore,
    EventEmitter<ClientStoreEvents>,
    StoreInterface {
  getClient(): ClientManifest | null

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_INSTALL}
   */
  downloadLatestClient(): Promise<void>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_INSTALL}
   * @param zipPath 
   */
  loadClientFromZip(zipPath: string): Promise<void>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_DOWNLOAD}
   * @param url
   */
  loadClientFromURL(url: string): Promise<void>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_REFRESH}
   */
  refreshClient(): Promise<ClientManifest | null>

  /**
   * Sets the client manifest.
   * @param client The client manifest to set.
   */
  updateClient(client: Partial<ClientManifest>): Promise<void>

  setClient(client: ClientManifest): Promise<void>
}
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
  getClient(): Promise<ClientManifest | null>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_INSTALL}
   * @param zipPath
   */
  loadClientFromZip(zipPath: string): Promise<void>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_DOWNLOAD}
   * @param url
   */
  loadClientFromURL(url: string): Promise<ClientManifest | undefined>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_REFRESH}
   */
  refreshClient(): Promise<ClientManifest | null>

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_DOWNLOAD}
   */
  downloadLatestClient(): Promise<ClientManifest | undefined>

  /**
   * Sets the client manifest.
   * @param client The client manifest to set.
   */
  updateClient(client: Partial<ClientManifest>): Promise<void>

  setClient(client: ClientManifest): Promise<void>
}

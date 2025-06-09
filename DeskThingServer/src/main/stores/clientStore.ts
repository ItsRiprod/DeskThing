import { ClientManifest } from '@deskthing/types'
import { ClientStoreClass, ClientStoreEvents } from '@shared/stores/clientStore'
import { CacheableStore, ProgressChannel } from '@shared/types'
import EventEmitter from 'node:events'
import {
  downloadAndInstallClient,
  getClientManifest,
  loadClientFromZip,
  updateManifest
} from '@server/services/client/clientService'
import { progressBus } from '@server/services/events/progressBus'
import logger from '@server/utils/logger'
import { handleError } from '@server/utils/errorHandler'

export class ClientStore
  extends EventEmitter<ClientStoreEvents>
  implements CacheableStore, ClientStoreClass
{
  private _client: ClientManifest | null = null
  private _initialized: boolean = false

  public get initialized(): boolean {
    return this._initialized
  }

  constructor() {
    super()
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.refreshClient()
  }

  public clearCache = async (): Promise<void> => {
    this._client = null
  }

  public saveToFile = async (): Promise<void> => {
    if (!this._client) return
    logger.debug('Saving client to file', {
      function: 'ClientStore.saveToFile',
      source: 'client-store'
    })
    updateManifest(this._client)
  }

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_DOWNLOAD}
   * @param url
   */
  async loadClientFromURL(url: string): Promise<ClientManifest | undefined> {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_CLIENT_DOWNLOAD,
        'Load-Client',
        'Initializing load...',
        [
          {
            channel: ProgressChannel.FN_CLIENT_INSTALL,
            weight: 50
          },
          {
            channel: ProgressChannel.ST_CLIENT_REFRESH,
            weight: 50
          }
        ]
      )
      try {
        await downloadAndInstallClient(url)
      } catch (error) {
        logger.warn(`Failed to download client ${handleError(error)}`, {
          function: 'loadClientFromURL',
          source: 'ClientStore'
        })
      }
      const result = await this.refreshClient()

      if (!result) {
        progressBus.warn(ProgressChannel.ST_CLIENT_DOWNLOAD, 'Load-Client', 'Client is not valid')
      }

      progressBus.complete(
        ProgressChannel.ST_CLIENT_DOWNLOAD,
        'Load-Client',
        'Client loaded successfully!'
      )

      return result || undefined
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_CLIENT_DOWNLOAD,
        'Load-Client',
        'Error loading client',
        handleError(error)
      )
      return
    }
  }

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_INSTALL}
   * @param zipPath
   */
  async loadClientFromZip(zipPath: string): Promise<void> {
    progressBus.startOperation(
      ProgressChannel.ST_CLIENT_INSTALL,
      'Load-Client',
      'Initializing load...',
      [
        {
          channel: ProgressChannel.FN_CLIENT_INSTALL,
          weight: 100
        }
      ]
    )
    await loadClientFromZip(zipPath)
    progressBus.complete(
      ProgressChannel.ST_CLIENT_INSTALL,
      'Load-Client',
      'Client loaded successfully!'
    )
  }

  /**
   * Sets the client manifest.
   * @param _client The client manifest to set.
   */
  async updateClient(_client: Partial<ClientManifest>): Promise<void> {
    this._client = {
      ...this._client,
      ..._client
    } as ClientManifest
    this.emit('client-updated', this._client)
  }

  /**
   * @channel - {@link ProgressChannel.ST_CLIENT_REFRESH}
   */
  async refreshClient(): Promise<ClientManifest | null> {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_CLIENT_REFRESH,
        'Refresh Client',
        'Getting client...'
      )
      const client = await getClientManifest()

      progressBus.update(ProgressChannel.ST_CLIENT_REFRESH, 'Validating client...', 50)

      // TODO: Validate client

      if (!client) {
        progressBus.error(
          ProgressChannel.ST_CLIENT_REFRESH,
          'Refresh Client',
          'Client is not valid'
        )
        return null
      }

      progressBus.update(ProgressChannel.ST_CLIENT_REFRESH, 'Saving client...', 75)
      this.setClient(client)
      progressBus.complete(
        ProgressChannel.ST_CLIENT_REFRESH,
        'Refresh-Client',
        'Client refreshed successfully!'
      )
      return client
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_CLIENT_REFRESH,
        'Refresh-Client',
        'Error refreshing client',
        handleError(error)
      )
      return null
    }
  }

  async setClient(_client: ClientManifest): Promise<void> {
    this._client = _client
    this.emit('client-updated', _client)
  }

  getClient(): ClientManifest | null {
    return this._client
  }
}

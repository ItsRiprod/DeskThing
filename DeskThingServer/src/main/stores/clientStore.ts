import { ClientManifest } from '@deskthing/types'
import { ClientStoreClass, ClientStoreEvents } from '@shared/stores/clientStore'
import { CacheableStore, ClientLatestServer, ProgressChannel } from '@shared/types'
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
import { ReleaseStoreClass } from '@shared/stores/releaseStore'
import { satisfies } from 'semver'

export class ClientStore
  extends EventEmitter<ClientStoreEvents>
  implements CacheableStore, ClientStoreClass
{
  private _client: ClientManifest | null = null
  private _initialized: boolean = false

  public get initialized(): boolean {
    return this._initialized
  }

  constructor(private releaseStore: ReleaseStoreClass) {
    super()
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.refreshClient()
    this.initializeListeners()
  }

  private initializeListeners = (): void => {
    this.releaseStore.on('client', async (clientReleases) => {
      /** Check for updates */
      await this.checkForUpdates(clientReleases)
    })
  }

  private checkForUpdates = async (clientReleases: ClientLatestServer[]): Promise<void> => {
    // If this client is missing
    const client = await this.getClient()

    if (!client) return // there is no client to update

    const updatedClientRelease = clientReleases.find((release) => release.id == client.id)

    if (!updatedClientRelease) return // there was no found client to update

    // if the existing version is less than the current
    if (satisfies(client.version, `<${updatedClientRelease.mainRelease.clientManifest.version}`)) {
      client.meta = {
        updateAvailable: true, // if this is an error, update deskthing-types to v0.11.7 or later
        updateVersion: updatedClientRelease.mainRelease.clientManifest.version
      }
      this.setClient(client)
    } else {
      logger.debug(`Client is up to date on version ${client.version}`, {
        function: 'checkForUpdates',
        source: 'client-store'
      })
    }
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
   * @channel - {@link ProgressChannel.ST_CLIENT_DOWNLOAD_LATEST}
   */
  async downloadLatestClient(): Promise<ClientManifest | undefined> {
    progressBus.startOperation(
      ProgressChannel.ST_CLIENT_DOWNLOAD_LATEST,
      'Download-Client',
      'Initializing download...',
      [
        {
          channel: ProgressChannel.ST_RELEASE_CLIENT_DOWNLOAD,
          weight: 100
        }
      ]
    )
    try {
      const client = await this.releaseStore.downloadLatestClient()
      progressBus.complete(
        ProgressChannel.ST_CLIENT_DOWNLOAD_LATEST,
        'Download-Client',
        'Client downloaded successfully!'
      )
      return client
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_CLIENT_DOWNLOAD_LATEST,
        'Download-Client',
        'Error downloading client',
        handleError(error)
      )
      return undefined
    }
  }

  /**
   * Sets the client manifest.
   * @param _client The client manifest to set.
   */
  async updateClient(_client: Partial<ClientManifest>): Promise<void> {
    const client = await this.getClient()

    const updatedClient = {
      ...client,
      ..._client
    } as ClientManifest

    this.setClient(updatedClient)
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

  async setClient(client: ClientManifest): Promise<void> {
    this._client = client
    this.emit('client-updated', client)
  }

  public getClient = async (): Promise<ClientManifest | null> => {
    if (!this._client) {
      this._client = await this.refreshClient()
    }

    return this._client
  }
}

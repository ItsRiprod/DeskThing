/**
 * Temporarily holds the entire repo response information in memory unless manually refreshed
 *
 * Holds the AppReleaseMeta information and properly stores it when needed
 */

// types
import {
  AppLatestServer,
  AppReleaseFile0118,
  CacheableStore,
  ClientLatestServer,
  ClientReleaseFile0118,
  ProgressChannel
} from '@shared/types'
import { GithubListenerEvents, ReleaseStoreClass } from '@shared/stores/releaseStore'

// Utils
import logger from '@server/utils/logger'

// Static

// Services
import {
  readAppReleaseData,
  readClientReleaseData,
  saveAppReleaseData,
  saveClientReleaseData
} from '@server/services/files/releaseFileService'
import { progressBus } from '@server/services/events/progressBus'
import EventEmitter from 'node:events'
import { isCacheValid } from '@server/services/releases/releaseValidation'
import {
  createAppReleaseFile,
  handleRefreshAppReleaseFile
} from '@server/services/releases/appReleaseUtils'
import {
  createClientReleaseFile,
  handleRefreshClientReleaseFile
} from '@server/services/releases/clientReleaseUtils'
import { handleError } from '@server/utils/errorHandler'

/**
 * Temporarily holds the entire repo response information in memory unless manually refreshed
 * Holds the AppReleaseMeta information and properly stores it when needed
 */
export class ReleaseStore
  extends EventEmitter<GithubListenerEvents>
  implements CacheableStore, ReleaseStoreClass
{
  private appReleases: AppReleaseFile0118 | undefined
  private clientReleases: ClientReleaseFile0118 | undefined

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  constructor() {
    super()
  }

  public initialize = async (): Promise<void> => {
    if (this._initialized) return
    this._initialized = true
  }

  public clearCache = async (): Promise<void> => {
    await this.saveAppReleaseFile(true)
    await this.saveClientReleaseFile(true)
  }

  public saveToFile = async (): Promise<void> => {
    await this.saveAppReleaseFile()
    await this.saveClientReleaseFile()
  }

  /**
   * Returns the cached version or the version from file - whichever is more updated
   */
  private getClientReleaseFile = async (): Promise<ClientReleaseFile0118 | undefined> => {
    if (this.clientReleases) return this.clientReleases
    try {
      this.clientReleases = await readClientReleaseData()
      logger.debug(`Received ${this.clientReleases?.releases?.length} client releases from file`, {
        function: 'getClientReleaseFile',
        source: 'releaseStore'
      })
      return this.clientReleases
    } catch (error) {
      logger.warn(`There was an error reading appReleaseFile ${handleError(error)}`, {
        error: error as Error,
        function: 'getAppReleaseFile',
        source: 'releaseStore'
      })
      return
    }
  }

  /**
   * Returns the cached version or the version from file - whichever is more updated
   */
  private getAppReleaseFile = async (): Promise<AppReleaseFile0118 | undefined> => {
    if (this.appReleases) return this.appReleases
    try {
      this.appReleases = await readAppReleaseData()
      logger.debug(`Received ${this.appReleases?.releases?.length} app releases from file`, {
        function: 'getAppReleaseFile',
        source: 'releaseStore'
      })
      return this.appReleases
    } catch (error) {
      logger.warn(`There was an error reading appReleaseFile ${handleError(error)}`, {
        error: error as Error,
        function: 'getAppReleaseFile',
        source: 'releaseStore'
      })
      return
    }
  }

  private saveClientReleaseFile = async (clearCache = false): Promise<void> => {
    if (!this.clientReleases) {
      logger.warn('Unable to save the client release file as it does not exist')
      return
    }

    try {
      await saveClientReleaseData(this.clientReleases)

      this.emit('client', this.clientReleases.releases)
      this.emit('clientRepos', this.clientReleases.repositories)
      // Only clear the cache if the saveClientReleaseData is successful
      if (clearCache) this.clientReleases = undefined
    } catch (error) {
      logger.error(`Failed to save client release file: ${handleError(error)}`, {
        error: error as Error,
        function: 'saveClientReleaseFile',
        source: 'releaseStore'
      })
    }
  }

  private saveAppReleaseFile = async (clearCache = false): Promise<void> => {
    if (!this.appReleases) {
      logger.warn('Unable to save the app release file as it does not exist')
      return
    }

    try {
      await saveAppReleaseData(this.appReleases)

      this.emit('app', this.appReleases.releases)
      this.emit('appRepos', this.appReleases.repositories)
      // Only clear the cache if the saveClientReleaseData is successful
      if (clearCache) this.appReleases = undefined
    } catch (error) {
      logger.error(`Failed to save app release file: ${handleError(error)}`, {
        error: error as Error,
        function: 'saveClientReleaseFile',
        source: 'releaseStore'
      })
    }
  }

  /**
   * ---------------------------
   * Public Methods
   */

  /**
   * Gets the app and client releases from file, checks if their cache is valid, and updates them if they're not
   * @param force - If true, will force a refresh even if the cache is valid
   */
  public refreshData = async (force?: boolean): Promise<void> => {
    progressBus.startOperation(
      ProgressChannel.ST_RELEASE_REFRESH,
      'Refreshing releases',
      'Initializing',
      [
        {
          channel: ProgressChannel.ST_RELEASE_APP_REFRESH,
          weight: 50
        },
        {
          channel: ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
          weight: 50
        }
      ]
    )

    await this.refreshApps(force)
    await this.refreshClients(force)

    progressBus.complete(
      ProgressChannel.ST_RELEASE_REFRESH,
      'Completed Refresh',
      'Refreshing Releases'
    )
  }

  private refreshApps = async (force?: boolean): Promise<void> => {
    progressBus.startOperation(
      ProgressChannel.ST_RELEASE_APP_REFRESH,
      'Refreshing App Releases',
      'Initializing',
      [
        {
          channel: ProgressChannel.FN_RELEASE_APP_REFRESH,
          weight: 100
        }
      ]
    )
    try {
      const appReleases = await this.getAppReleaseFile()

      // Check if we need to refresh the app releases
      if (!appReleases) {
        throw new Error('AppReleases is undefined!')
      }

      // Handle refreshing the existing data
      if (force || !isCacheValid(appReleases)) {
        this.appReleases = await handleRefreshAppReleaseFile(appReleases, {
          force,
          updateStates: true
        })
        this.saveAppReleaseFile(false)
        return
      }
    } catch (error) {
      logger.debug(`Fetching initial app file because ${handleError(error)}`)
      this.appReleases = await createAppReleaseFile(force)
      this.saveAppReleaseFile(false)
      logger.debug('Finished fetching initial app release file')
      return
    }
  }

  private refreshClients = async (force?: boolean): Promise<void> => {
    progressBus.startOperation(
      ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
      'Refreshing App Releases',
      'Initializing',
      [
        {
          channel: ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
          weight: 100
        }
      ]
    )

    try {
      const clientReleases = await this.getClientReleaseFile()

      // Check if we need to refresh the app releases
      if (!clientReleases) {
        throw new Error('ClientReleases is undefined!')
      }

      // Handle refreshing the existing data
      if (force || !isCacheValid(clientReleases)) {
        this.clientReleases = await handleRefreshClientReleaseFile(clientReleases, {
          force,
          updateStates: true
        })
        this.saveClientReleaseFile(false)
        return
      }
    } catch (error) {
      logger.debug(`Fetching initial client file because ${handleError(error)}`)
      this.clientReleases = await createClientReleaseFile(force)
      this.saveClientReleaseFile(false)
      logger.debug('Finished fetching initial clientReleases release file')
      return
    }
  }

  public getCommunityApps = async (): Promise<string[] | undefined> => {
    const apps = await this.getAppReleaseFile()
    if (!apps) return undefined
    return apps.repositories
  }

  public getCommunityClients = async (): Promise<string[] | undefined> => {
    const clients = await this.getClientReleaseFile()
    if (!clients) return undefined
    return clients.repositories
  }

  public getAppReleases = async (): Promise<AppLatestServer[] | undefined> => {
    const apps = await this.getAppReleaseFile()
    if (!apps) return undefined
    return apps.releases
  }

  public getClientReleases = async (): Promise<ClientLatestServer[] | undefined> => {
    const clients = await this.getClientReleaseFile()
    if (!clients) return undefined
    return clients.releases
  }

  public getAppRelease = async (appId: string): Promise<AppLatestServer | undefined> => {
    const appReleases = await this.getAppReleaseFile()
    if (!appReleases) return undefined
    return appReleases.releases.find((app) => app.id === appId)
  }

  public getClientRelease = async (clientId: string): Promise<ClientLatestServer | undefined> => {
    const clients = await this.getClientReleaseFile()
    if (!clients) return undefined
    return clients.releases.find((client) => client.id === clientId)
  }

  public addAppRepository = async (_repoUrl: string): Promise<AppLatestServer | undefined> => {
    throw new Error('Method not implemented.')
  }

  public addClientRepository = async (repoUrl: string): Promise<ClientLatestServer | undefined> => {
    throw new Error('Method not implemented.')
  }

  public removeAppRelease = async (repoUrl: string): Promise<void> => {
    throw new Error('Method not implemented.')
  }

  public removeClientRelease = async (repoUrl: string): Promise<void> => {
    throw new Error('Method not implemented.')
  }

  public downloadLatestApp = async (appId: string): Promise<void> => {
    throw new Error('Method not implemented.')
  }

  public downloadLatestClient = async (clientId: string): Promise<void> => {
    throw new Error('Method not implemented.')
  }
}

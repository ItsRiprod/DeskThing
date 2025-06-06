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
import { isCacheValid } from '@server/services/releases/releaseUtils'
import {
  createAppReleaseFile,
  handleRefreshAppReleaseFile
} from '@server/services/releases/appReleaseUtils'

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
    this.appReleases = undefined
    this.clientReleases = undefined
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
    this.clientReleases = await readClientReleaseData()
    return this.clientReleases
  }

  /**
   * Returns the cached version or the version from file - whichever is more updated
   */
  private getAppReleaseFile = async (): Promise<AppReleaseFile0118 | undefined> => {
    if (this.appReleases) return this.appReleases
    this.appReleases = await readAppReleaseData()
    return this.appReleases
  }

  private saveClientReleaseFile = async (clearCache = false): Promise<void> => {
    if (!this.clientReleases) {
      logger.warn('Unable to save the client release file as it does not exist')
      return
    }

    try {
      await saveClientReleaseData(this.clientReleases)
      // Only clear the cache if the saveClientReleaseData is successful
      if (clearCache) this.clientReleases = undefined
    } catch (error) {
      logger.error('Failed to save client release file', {
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
      // Only clear the cache if the saveClientReleaseData is successful
      if (clearCache) this.appReleases = undefined
    } catch (error) {
      logger.error('Failed to save client release file', {
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
    const appReleases = await this.getAppReleaseFile()

    // Check if we need to refresh the app releases
    if (force || !appReleases) {
      logger.debug('Fetching initial app file')
      this.appReleases = await createAppReleaseFile(force)
      this.saveAppReleaseFile(true)
      logger.debug('Finished fetching initial app release file')
      return
    }

    // Handle refreshing the existing data
    if (force || !isCacheValid(appReleases)) {
      this.appReleases = await handleRefreshAppReleaseFile(appReleases, { force })
      this.saveAppReleaseFile(true)
      return
    }
  }

  private refreshClients = async (force?: boolean): Promise<void> => {
    const clientReleases = await this.getClientReleaseFile()

    if (force || !clientReleases || !isCacheValid(clientReleases)) {
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

  public getAppRelease = async (appId: string): Promise<AppLatestServer | undefined> => {
    const appReleases = await this.getAppReleaseFile()
    if (!appReleases) return undefined
    return appReleases.releases.find((app) => app.id === appId)
  }

  public addAppRepository = async (_repoUrl: string): Promise<AppLatestServer | undefined> => {
    throw new Error('Method not implemented.')
  }

  public removeAppRelease = async (repoUrl: string): Promise<void> => {
    throw new Error('Method not implemented.')
  }

  public getClientReleases = async (): Promise<ClientLatestServer[] | undefined> => {
    const clients = await this.getClientReleaseFile()
    if (!clients) return undefined
    return clients.releases
  }

  public getClientRelease = async (clientId: string): Promise<ClientLatestServer | undefined> => {
    const clients = await this.getClientReleaseFile()
    if (!clients) return undefined
    return clients.releases.find((client) => client.id === clientId)
  }

  public addClientRepository = async (
    _repoUrl: string
  ): Promise<ClientLatestServer | undefined> => {
    throw new Error('Method not implemented.')
  }

  public removeClientRelease = async (repoUrl: string): Promise<void> => {
    throw new Error('Method not implemented.')
  }
}

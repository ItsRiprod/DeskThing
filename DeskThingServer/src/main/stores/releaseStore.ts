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
  ProgressChannel,
  StagedAppManifest
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
import { handleError } from '@server/utils/errorHandler'
import {
  addRepositoryUrl,
  createReleaseFile,
  handleRefreshReleaseFile
} from '@server/services/releases/releaseUtils'
import { storeProvider } from './storeProvider'
import { ClientManifest, LOGGING_LEVELS } from '@deskthing/types'

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
      'Refreshing Both Releases',
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

    const updateStore = await storeProvider.getStore('updateStore')
    await updateStore.checkForUpdates()
    progressBus.complete(
      ProgressChannel.ST_RELEASE_REFRESH,
      'Refresh Complete',
      'Refreshing Releases'
    )
  }

  private refreshApps = async (force?: boolean): Promise<void> => {
    progressBus.startOperation(
      ProgressChannel.ST_RELEASE_APP_REFRESH,
      'Refreshing App Releases',
      'Initializing App Release',
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
        this.appReleases = await handleRefreshReleaseFile('app', appReleases, {
          force,
          updateStates: true
        })

        if (this.appReleases.releases.length == 0) {
          // This is a pretty worst-case scenario, but if the release file is empty, we should add the default repositories
          const { appsRepo } = await import('../static/releaseMetadata')
          await this.addRepositoryUrl(appsRepo)
        }

        await this.saveAppReleaseFile(false)
        progressBus.complete(
          ProgressChannel.ST_RELEASE_APP_REFRESH,
          'Finished fetching initial app release file'
        )
        return
      } else {
        progressBus.complete(
          ProgressChannel.ST_RELEASE_APP_REFRESH,
          'AppReleases is up to date (cache is up to date)'
        )
        return
      }
    } catch (error) {
      progressBus.warn(
        ProgressChannel.ST_RELEASE_APP_REFRESH,
        `Fetching initial app file because ${handleError(error)}`
      )
      this.appReleases = await createReleaseFile('app', force)
      if (this.appReleases.releases.length == 0) {
        // This is a pretty worst-case scenario, but if the release file is empty, we should add the default repositories
        const { appsRepo } = await import('../static/releaseMetadata')
        await this.addRepositoryUrl(appsRepo)
      }
      await this.saveAppReleaseFile(false)
      progressBus.complete(
        ProgressChannel.ST_RELEASE_APP_REFRESH,
        'Finished fetching initial app release file'
      )
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
        this.clientReleases = await handleRefreshReleaseFile('client', clientReleases, {
          force,
          updateStates: true
        })

        if (this.clientReleases.releases.length == 0) {
          // This is a pretty worst-case scenario, but if the release file is empty, we should add the default repositories
          const { clientRepo } = await import('../static/releaseMetadata')
          await this.addRepositoryUrl(clientRepo)
        }
        await this.saveClientReleaseFile(false)
        progressBus.complete(
          ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
          'Finished fetching initial client release file'
        )
        return
      } else {
        progressBus.complete(
          ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
          'ClientReleases is up to date (cache is up to date)'
        )
        return
      }
    } catch (error) {
      progressBus.warn(
        ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
        `Fetching initial client file because ${handleError(error)}`
      )
      this.clientReleases = await createReleaseFile('client', force)
      if (this.clientReleases.releases.length == 0) {
        // This is a pretty worst-case scenario, but if the release file is empty, we should add the default repositories
        const { clientRepo } = await import('../static/releaseMetadata')
        await this.addRepositoryUrl(clientRepo)
      }
      await this.saveClientReleaseFile(false)
      progressBus.complete(
        ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
        'Finished fetching initial clientReleases release file'
      )
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

  public addRepositoryUrl = async (
    repoUrl: string
  ): Promise<AppLatestServer[] | ClientLatestServer[] | undefined> => {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_RELEASE_ADD_REPO,
        'Adding Repo',
        `Adding ${repoUrl}`,
        [
          {
            weight: 100,
            channel: ProgressChannel.FN_RELEASE_ADD_REPO
          }
        ]
      )
      logger.debug(`Adding client repository: ${repoUrl}`, {
        function: 'addClientRepository',
        source: 'releaseStore'
      })

      // Use the addRepositoryUrl utility to fetch and process the repository
      const result = await addRepositoryUrl(repoUrl)

      // Handle different result types
      if (result.type === 'client') {
        // Single client release
        await this.addClientToReleases(result, repoUrl)
        return [result]
      } else if (result.type === 'converted-clients') {
        // Multiple client releases from conversion

        if (result.releases.length > 0) {
          // Add all client releases
          for (const clientRelease of result.releases) {
            await this.addClientToReleases(clientRelease, repoUrl)
          }

          return result.releases
        }
      } else if (result.type === 'app') {
        // This is an app repository, not a client repository
        await this.addAppToReleases(result, repoUrl)
        return undefined
      } else if (result.type === 'converted-apps') {
        // Multiple app releases - not what we want for client repository
        if (result.releases.length > 0) {
          // Add all client releases
          for (const appRelease of result.releases) {
            await this.addAppToReleases(appRelease, repoUrl)
          }

          return result.releases
        }
      }

      logger.warn(`No client releases found in repository: ${repoUrl}`, {
        function: 'addClientRepository',
        source: 'releaseStore'
      })
      return undefined
    } catch (error) {
      logger.error(`Failed to add client repository ${repoUrl}: ${handleError(error)}`, {
        error: error as Error,
        function: 'addClientRepository',
        source: 'releaseStore'
      })
      return undefined
    }
  }

  private addClientToReleases = async (
    clientRelease: ClientLatestServer,
    repoUrl: string
  ): Promise<void> => {
    // Ensure we have a client releases structure

    const clientReleases = await this.getClientReleaseFile()

    const debug = logger.createLogger(LOGGING_LEVELS.DEBUG, {
      function: 'addClientToReleases',
      source: 'releaseStore'
    })

    if (!clientReleases) {
      logger.error('Unable to find client release file!', {
        function: 'addClientToReleases',
        source: 'releaseStore'
      })
      return
    }

    // Check if this client already exists (avoid duplicates)
    const existingIndex = clientReleases.releases.findIndex(
      (existing) => existing.id === clientRelease.id
    )

    if (existingIndex !== -1) {
      // Update existing client release
      clientReleases.releases[existingIndex] = clientRelease
      debug(`Updated existing client release: ${clientRelease.id}`)
    } else {
      // Add new client release
      clientReleases.releases.push(clientRelease)
      debug(`Added new client release: ${clientRelease.id}`)
    }

    // Update timestamp
    clientReleases.timestamp = Date.now()

    // Save the updated client releases
    this.clientReleases = clientReleases

    // Save and announce the changes
    await this.saveClientReleaseFile(false)

    logger.info(
      `Successfully added/updated client ${clientRelease.id} from repository ${repoUrl}`,
      {
        function: 'addClientToReleases',
        source: 'releaseStore'
      }
    )
    this.emit('client', clientReleases.releases)
  }

  private addAppToReleases = async (
    appRelease: AppLatestServer,
    repoUrl: string
  ): Promise<void> => {
    // Ensure we have a client releases structure
    const appReleases = await this.getAppReleaseFile()

    if (!appReleases) {
      logger.error('Unable to find app release file!', {
        function: 'addAppToReleases',
        source: 'releaseStore'
      })
      return
    }

    const debug = logger.createLogger(LOGGING_LEVELS.DEBUG, {
      function: 'addAppToReleases',
      source: 'releaseStore'
    })

    // Check if this client already exists (avoid duplicates)
    const existingIndex = appReleases.releases.findIndex(
      (existing) => existing.id === appRelease.id
    )

    if (existingIndex !== -1) {
      // Update existing client release
      appReleases.releases[existingIndex] = appRelease
      debug(`Updated existing app release: ${appRelease.id}`)
    } else {
      // Add new client release
      appReleases.releases.push(appRelease)
      debug(`Added new app release: ${appRelease.id}`)
    }

    // Update timestamp
    appReleases.timestamp = Date.now()

    // Save the updated app releases
    this.appReleases = appReleases

    // Save and announce the changes
    await this.saveClientReleaseFile(false)

    logger.info(`Successfully added/updated app ${appRelease.id} from repository ${repoUrl}`, {
      function: 'addAppToReleases',
      source: 'releaseStore'
    })
    this.emit('app', appReleases.releases)
  }

  public removeAppRelease = async (appId: string): Promise<void> => {
    progressBus.start(
      ProgressChannel.ST_RELEASE_APP_REMOVE,
      'Removing App Release',
      `Removing ${appId}`
    )

    if (!appId) {
      progressBus.error(
        ProgressChannel.ST_RELEASE_APP_REMOVE,
        'No repository URL or app ID provided'
      )
      return
    }

    const appReleases = await this.getAppReleaseFile()

    if (!appReleases) {
      progressBus.error(ProgressChannel.ST_RELEASE_APP_REMOVE, 'No app releases found')
      return
    }

    const existingIndex = appReleases.releases.findIndex((existing) => existing.id === appId)

    if (existingIndex !== -1) {
      appReleases.releases.splice(existingIndex, 1)
      appReleases.timestamp = Date.now()
      this.appReleases = appReleases
      await this.saveClientReleaseFile(false)
      progressBus.complete(
        ProgressChannel.ST_RELEASE_APP_REMOVE,
        `Successfully removed app release ${appId}`
      )
    } else {
      progressBus.error(
        ProgressChannel.ST_RELEASE_APP_REMOVE,
        `No app release found for app ID ${appId}`
      )
    }

    this.emit('app', appReleases.releases)
  }

  public removeClientRelease = async (clientId: string): Promise<void> => {
    progressBus.start(
      ProgressChannel.ST_RELEASE_CLIENT_REMOVE,
      'Removing Client Release',
      `Removing ${clientId}`
    )

    if (!clientId) {
      progressBus.error(ProgressChannel.ST_RELEASE_CLIENT_REMOVE, 'No client ID provided')
      return
    }

    const clientReleases = await this.getClientReleaseFile()

    if (!clientReleases) {
      progressBus.error(ProgressChannel.ST_RELEASE_CLIENT_REMOVE, 'No client releases found')
      return
    }

    const existingIndex = clientReleases.releases.findIndex((existing) => existing.id === clientId)

    if (existingIndex !== -1) {
      clientReleases.releases.splice(existingIndex, 1)
      clientReleases.timestamp = Date.now()
      this.clientReleases = clientReleases
      await this.saveClientReleaseFile(false)
      progressBus.complete(
        ProgressChannel.ST_RELEASE_CLIENT_REMOVE,
        `Successfully removed client release ${clientId}`
      )
    } else {
      progressBus.error(
        ProgressChannel.ST_RELEASE_CLIENT_REMOVE,
        `No client release found for client ID ${clientId}`
      )
    }

    this.emit('client', clientReleases.releases)
  }
  public downloadLatestApp = async (appId: string): Promise<StagedAppManifest | undefined> => {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_RELEASE_APP_DOWNLOAD,
        `Downloading ${appId}`,
        'Initializing',
        [
          {
            channel: ProgressChannel.ST_APP_INSTALL,
            weight: 100
          }
        ]
      )

      const appRelease = await this.getAppRelease(appId)

      if (!appRelease) return

      const appStore = await storeProvider.getStore('appStore')
      const appManifest = await appStore.addApp({
        filePath: appRelease.mainRelease.updateUrl,
        releaseMeta: appRelease.mainRelease
      })

      progressBus.complete(
        ProgressChannel.ST_RELEASE_APP_DOWNLOAD,
        `Completed downloading ${appId}`
      )

      return appManifest
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_RELEASE_APP_DOWNLOAD,
        `There was an error trying to download the app ${appId}. ${handleError(error)}`,
        'Error Downloading App'
      )
      return
    }
  }

  public downloadLatestClient = async (clientId: string): Promise<ClientManifest | undefined> => {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_RELEASE_CLIENT_DOWNLOAD,
        'Downloading Client',
        'Initializing',
        [
          {
            channel: ProgressChannel.ST_CLIENT_DOWNLOAD,
            weight: 100
          }
        ]
      )

      logger.debug('Downloading client')
      const clientRelease = await this.getClientRelease(clientId)

      if (!clientRelease) {
        logger.debug('Client Release not found for ' + clientId)
        return
      }

      const clientStore = await storeProvider.getStore('clientStore')
      const clientManifest = await clientStore.loadClientFromURL(
        clientRelease.mainRelease.updateUrl
      )
      progressBus.complete(ProgressChannel.ST_RELEASE_CLIENT_DOWNLOAD, 'Completed the Download')
      return clientManifest
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_RELEASE_CLIENT_DOWNLOAD,
        `There was an error trying to download the client ${clientId}. ${handleError(error)}`,
        'Error Downloading Client'
      )
      return
    }
  }
}

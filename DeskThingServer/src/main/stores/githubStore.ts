/**
 * Temporarily holds the entire repo response information in memory unless manually refreshed
 *
 * Holds the AppReleaseMeta information and properly stores it when needed
 */
console.log('[Github Store] Starting')
import {
  AppReleaseFile,
  CacheableStore,
  ClientReleaseFile,
  GithubAsset,
  GithubRelease
} from '@shared/types'
import { fetchAssetContent, getLatestRelease } from '@server/services/github/githubService'
import {
  AppReleaseCommunity,
  AppReleaseMeta,
  AppReleaseSingleMeta,
  ClientReleaseMeta
} from '@deskthing/types'
import logger from '@server/utils/logger'
import { defaultClientReleaseFile, defaultAppReleaseData } from '@server/static/defaultRepos'
import {
  isValidAppReleaseMeta,
  isValidClientReleaseFile
} from '@server/services/github/githubUtils'
import {
  readAppReleaseData,
  readClientReleaseData,
  saveAppReleaseData,
  saveClientReleaseData
} from '@server/services/files/releaseFileService'
import {
  AssetAppCacheEntry,
  AssetClientCacheEntry,
  CacheEntry,
  GithubListenerEvents,
  GithubStoreClass,
  GithubStoreListener,
  GithubStoreListeners
} from '@shared/stores/githubStore'

/**
 * Temporarily holds the entire repo response information in memory unless manually refreshed
 *
 * Holds the AppReleaseMeta information and properly stores it when needed
 */
export class GithubStore implements CacheableStore, GithubStoreClass {
  private cache: Map<string, CacheEntry>
  private assetAppCache: Map<string, AssetAppCacheEntry>
  private assetClientCache: Map<string, AssetClientCacheEntry>
  private appReleases: AppReleaseFile | null
  private clientReleases: ClientReleaseFile | null
  private cachedRepos: string[]

  private listeners: GithubStoreListeners = {
    app: [],
    community: [],
    client: []
  }

  constructor() {
    // Cache of github responses
    this.cache = new Map()
    this.assetAppCache = new Map()
    this.assetClientCache = new Map()

    // Cache of repos that have been fetched
    this.cachedRepos = []

    // app references
    this.appReleases = defaultAppReleaseData

    // not fully implemented yet
    this.clientReleases = defaultClientReleaseFile

    // Ensure that nothing is fetched at startup and blocking the main thread
    setTimeout(this.refreshData, 10)
  }

  clearCache = async (): Promise<void> => {
    this.cache.clear()
    this.assetAppCache.clear()
    this.assetClientCache.clear()
    this.cachedRepos = []
    this.appReleases = null
    this.clientReleases = null
  }

  saveToFile = async (): Promise<void> => {
    if (this.appReleases) {
      await this.saveAppReleaseFile()
    }
    if (this.clientReleases) {
      await this.saveClientReleaseFile()
    }
  }

  private notifyListeners = <K extends keyof GithubListenerEvents>(
    event: K,
    payload: GithubListenerEvents[K]
  ): void => {
    this.listeners[event].forEach((listener) => listener(payload))
  }

  on<K extends keyof GithubListenerEvents>(type: K, listener: GithubStoreListener<K>): () => void {
    this.listeners[type].push(listener)
    return () => this.off(type, listener)
  }

  off<K extends keyof GithubListenerEvents>(type: K, listener: GithubStoreListener<K>): void {
    this.listeners[type] = this.listeners[type].filter(
      (l) => l !== listener
    ) as GithubStoreListeners[K]
  }

  public refreshData = async (force = false): Promise<void> => {
    logger.debug('Refreshing data...', {
      function: 'refreshData',
      source: 'GithubStore'
    })
    this.cache.clear()
    this.cachedRepos = []
    await this.getAppReleaseFile()
    await Promise.all([this.getAppLatestJsonFile(force), this.getClientLatestJsonFile(force)])
  }

  private saveAppReleaseFile = async (appReleaseFile?: AppReleaseFile): Promise<void> => {
    if (!this.appReleases) {
      this.appReleases = appReleaseFile ?? defaultAppReleaseData
    }
    try {
      await saveAppReleaseData(this.appReleases)
      this.notifyListeners('app', this.appReleases.releases)
      this.notifyListeners('community', this.appReleases.references)
    } catch (error) {
      logger.error('Failed to save app release data:', {
        error: error as Error,
        function: 'saveAppReleaseFile',
        source: 'GithubStore'
      })
    }
  }

  private saveClientReleaseFile = async (clientReleaseFile?: ClientReleaseFile): Promise<void> => {
    if (!this.clientReleases) {
      this.clientReleases = clientReleaseFile ?? defaultClientReleaseFile
    }
    try {
      await saveClientReleaseData(this.clientReleases)
      this.notifyListeners('client', this.clientReleases.releases)
    } catch (error) {
      logger.error('Failed to save app release data:', {
        error: error as Error,
        function: 'saveAppReleaseFile',
        source: 'GithubStore'
      })
    }
  }

  private getAppReleaseFile = async (): Promise<AppReleaseFile> => {
    if (!this.appReleases || !this.appReleases.timestamp || !this.isCacheValid(this.appReleases)) {
      try {
        const updatedReleaseData = await readAppReleaseData()
        this.appReleases = updatedReleaseData ?? defaultAppReleaseData
      } catch (error) {
        logger.error('Failed to update app release data:', {
          error: error as Error,
          function: 'getAppReleaseFile',
          source: 'GithubStore'
        })
        this.appReleases = this.appReleases || defaultAppReleaseData
        await this.saveAppReleaseFile()
        return this.appReleases
      }
    }

    return this.appReleases
  }

  private getClientReleaseFile = async (): Promise<ClientReleaseFile> => {
    if (
      !this.clientReleases ||
      !this.clientReleases.timestamp ||
      !this.isCacheValid(this.clientReleases)
    ) {
      try {
        const updatedReleaseData = await readClientReleaseData()
        isValidClientReleaseFile(updatedReleaseData)
        this.clientReleases = updatedReleaseData ?? defaultClientReleaseFile
      } catch (error) {
        logger.error('Failed to update client release data:', {
          error: error as Error,
          function: 'getClientReleaseFile',
          source: 'GithubStore'
        })
        this.clientReleases = this.clientReleases || defaultClientReleaseFile
        await this.saveClientReleaseFile()
        return this.clientReleases
      }
    }
    return this.clientReleases
  }

  /**
   * Updates the application release file by fetching the latest release information from the GitHub API.
   * This method retrieves the latest release from the main repository, fetches the 'latest.json' and 'community.json'
   * assets, and updates the application release file accordingly.
   */
  private async getAppLatestJsonFile(force = false): Promise<void> {
    try {
      const appReleases = await this.getAppReleaseFile()

      // Early break if the cache is valid still
      if (this.isCacheValid(appReleases) && force === false) {
        return
      }

      const mainRepoReleases = await this.fetchLatestRelease('github.com/itsriprod/deskthing-apps')
      const latestRelease = mainRepoReleases[0]
      const latestJson = await this.fetchAppAssetContent(
        latestRelease.assets.find((a) => a.name === 'latest.json')
      )

      try {
        logger.debug('Updating community file...', {
          function: 'getAppLatestJsonFile',
          source: 'GithubStore'
        })

        const communityJson = await this.fetchAppAssetContent(
          latestRelease.assets.find((a) => a.name === 'community.json')
        )

        if (!communityJson) {
          throw new Error('Invalid community.json')
        }

        isValidAppReleaseMeta(communityJson)

        if (communityJson.type === 'external') {
          appReleases.references = [
            ...communityJson.releases,
            ...appReleases.references.filter(
              (r) => !communityJson.releases.some((c) => c.id === r.id)
            )
          ]

          appReleases.references = appReleases.references.map((r) =>
            appReleases.releases.some((c) => c.type != 'external' && c.repository == r.repository)
              ? { ...r, added: true }
              : r
          )
        }
      } catch (error) {
        logger.error('Error fetching community.json:', {
          function: 'getAppLatestJsonFile',
          source: 'GithubStore',
          error: error as Error
        })
      }

      try {
        logger.debug('Updating app release file...', {
          function: 'getAppLatestJsonFile',
          source: 'GithubStore'
        })

        if (!latestJson) {
          throw new Error('[getAppLatestJsonFile] Invalid latest.json. Not found')
        }
        isValidAppReleaseMeta(latestJson)

        // Merge it as multi
        appReleases.releases = [
          latestJson,
          ...appReleases.releases.filter((r) => r.id !== latestJson.id)
        ]

        // For every release
        for (const release of appReleases.releases) {
          try {
            // Get the latest.json from the release
            const newRelease = this.getAppLatestJson(release)

            Object.assign(release, newRelease)
          } catch (error) {
            const releaseId = release.type == 'multi' ? release.repository : release.id

            logger.error(`Error fetching latest.json for ${releaseId}`, {
              function: 'getAppLatestJsonFile',
              source: 'GithubStore',
              error: error as Error
            })
          }
        }
      } catch (error) {
        logger.error('Error fetching latest.json:', {
          function: 'getAppLatestJsonFile',
          source: 'GithubStore',
          error: error as Error
        })
      }

      logger.info('Update Successful!', {
        function: 'getAppLatestJsonFile',
        source: 'GithubStore'
      })

      appReleases.timestamp = Date.now()
      this.saveAppReleaseFile(appReleases)
    } catch (error) {
      logger.error('Error updating app release file:', {
        function: 'getAppLatestJsonFile',
        source: 'GithubStore',
        error: error as Error
      })
    }
  }

  private async getClientLatestJsonFile(force = false): Promise<void> {
    const clientReleaseFile = await this.getClientReleaseFile()

    // Early break if the cache is valid still
    if (this.isCacheValid(clientReleaseFile) && force === false) {
      return
    }

    try {
      logger.debug('Updating app release file...', {
        function: 'getAppLatestJsonFile',
        source: 'GithubStore'
      })

      const repositories = [
        ...new Set([
          ...clientReleaseFile.releases.map((r) => r.repository.toLowerCase()),
          ...clientReleaseFile.repositories.map((r) => r.toLowerCase())
        ])
      ]

      // Awaits for all of hte getClientLatestJsons to run an then filters out any that failed
      clientReleaseFile.releases = (
        await Promise.all(
          repositories.map(async (repo) => {
            try {
              const newRelease = await this.getClientLatestJson(repo)
              return newRelease
            } catch (error) {
              logger.error(`Error fetching latest.json for ${repo}`, {
                function: 'getClientLatestJsonFile',
                source: 'GithubStore',
                error: error as Error
              })
              return undefined
            }
          })
        )
      ).filter((release): release is ClientReleaseMeta => release !== undefined)
    } catch (error) {
      logger.error('Error fetching latest.json:', {
        function: 'getClientLatestJsonFile',
        source: 'GithubStore',
        error: error as Error
      })
    }

    logger.info('Update Successful!', {
      function: 'getClientLatestJsonFile',
      source: 'GithubStore'
    })

    clientReleaseFile.timestamp = Date.now()
    this.saveClientReleaseFile(clientReleaseFile)
  }

  private getAppLatestJson = async (
    release: AppReleaseMeta | string
  ): Promise<AppReleaseMeta | undefined> => {
    try {
      if (!release) throw new Error('[getAppLatestJson] Release does not exist')
      if (typeof release !== 'string' && !['single', 'multi'].includes(release.type)) {
        throw new Error('[getAppLatestJson] Invalid release type')
      }

      let releaseUrl: string = ''
      if (typeof release !== 'string') {
        if (!release || (release.type !== 'single' && release.type !== 'multi'))
          throw new Error('[getAppLatestJson] Invalid release (release is not single or multi)')
        releaseUrl = release.repository
      } else {
        releaseUrl = release
      }

      const repoReleases = await this.fetchLatestRelease(releaseUrl)
      const latest = repoReleases[0]

      const latestJson = await this.fetchAppAssetContent(
        latest.assets.find((a) => a.name === 'latest.json')
      )

      if (latestJson && latestJson.type == 'multi') {
        latestJson.releases = await Promise.all(
          latestJson.releases.map(async (meta) => {
            const releaseFiles = latest.assets
              .filter((a) => a.name.toLowerCase().includes(meta.id.toLowerCase()))
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            const releaseFile = releaseFiles.reduce(
              (acc, curr) => ({
                ...curr,
                download_count: (acc?.download_count || 0) + (curr.download_count || 0),
                created_at: acc?.created_at || curr.created_at,
                browser_download_url: acc?.browser_download_url || curr.browser_download_url
              }),
              releaseFiles[0]
            )
            return {
              ...meta,
              downloads: releaseFile?.download_count || 0,
              createdAt: new Date(releaseFile?.created_at || '').getTime(),
              updateUrl: releaseFile?.browser_download_url || ''
            }
          })
        )
      } else if (latestJson && latestJson.type == 'single') {
        const releaseFile = latest.assets.find((a) => a.name.includes(latestJson.id))
        latestJson.downloads = releaseFile?.download_count || 0
        latestJson.createdAt = new Date(releaseFile?.created_at || '').getTime()
        latestJson.updateUrl = releaseFile?.browser_download_url || ''
      } else {
        logger.warn(
          `Unable to determine the latest.json file for ${releaseUrl}. Attempting to reconstruct it`,
          {
            function: 'getAppLatestJson',
            source: 'GithubStore'
          }
        )
        const repoMatch = releaseUrl.match(/github\.com\/([^/]+)\/([^/]+)/)

        const releaseFile =
          (repoMatch?.[2] && latest.assets.find((a) => a.name.includes(repoMatch[2]))) ||
          latest.assets.find((a) => a.name.endsWith('.zip'))

        const references = await this.getAppReferences()
        const reference = references?.find((r) => r.repository == releaseUrl)

        // Attempts to find the download URL that will be used to download the app
        const downloadUrl = async (): Promise<string> => {
          // Early return with the browser_download_url (best case scenario)
          if (releaseFile?.browser_download_url) {
            return releaseFile.browser_download_url
          } else {
            // Check if the release is a reference
            if (typeof release != 'string' && release.type == 'single') {
              return release.updateUrl
            }

            // Fallback to check if the app has a reference
            if (reference) {
              // Attempt tagged release
              const potentialUrl = `https://github.com/${repoMatch?.[1] + '/' + repoMatch?.[2]}/releases/download/${reference.version}/${reference.id}.zip`
              const response = await fetch(potentialUrl)
              if (response.status == 200) {
                return potentialUrl
              } else {
                // Attempt latest release
                const secondPotentialUrl = `https://github.com/${repoMatch?.[1] + '/' + repoMatch?.[2]}/releases/download/latest/${reference?.id}.zip`
                const secondResponse = await fetch(secondPotentialUrl)
                if (secondResponse.status == 200) {
                  return secondPotentialUrl
                } else {
                  // Fallback to the default URL
                  return `https://github.com/${repoMatch?.[1] + '/' + repoMatch?.[2]}/releases/download/latest/${reference?.id}.zip`
                }
              }
            } else {
              return ''
            }
          }
        }

        return {
          type: 'single',
          id:
            reference?.id ||
            releaseFile?.name.trim().replaceAll(' ', '-') ||
            repoMatch?.[2] ||
            'Unknown',
          label:
            reference?.label ||
            releaseFile?.name.replace('.zip', '') ||
            repoMatch?.[2] ||
            'Unknown App',
          version:
            reference?.version.replaceAll('v', '') ||
            latest?.tag_name.replaceAll('v', '') ||
            '0.0.0',
          description: reference?.description || latest.body || 'No description available',
          author:
            reference?.author ||
            releaseFile?.uploader.login ||
            latest.author.login ||
            repoMatch?.[1] ||
            'Unknown Author',
          platforms: [],
          homepage: reference?.homepage || releaseUrl,
          repository: releaseUrl,
          updateUrl: await downloadUrl(),
          tags: [],
          requiredVersions: {
            server: '>=0.0.0',
            client: '>=0.0.0'
          },
          icon: '',
          size: releaseFile?.size || 0,
          hash: '',
          hashAlgorithm: 'sha512',
          downloads: releaseFile?.download_count || 0,
          updatedAt: Date.now(),
          createdAt: new Date(releaseFile?.created_at || '').getTime()
        }
      }

      return latestJson
    } catch (error) {
      logger.error(`Error fetching latest.json for ${release}`, {
        function: 'getAppLatestJson',
        source: 'GithubStore',
        error: error as Error
      })

      if (typeof release !== 'string') {
        if (!release || (release.type !== 'single' && release.type !== 'multi'))
          throw new Error('[getAppLatestJson] Invalid release (release is not single or multi)')
        return release
      }

      const repoMatch = release.match(/github\.com\/([^/]+)\/([^/]+)/)

      const rebuiltAppMeta: AppReleaseMeta = {
        type: 'single',
        id: repoMatch?.[2] || 'Unknown',
        label: repoMatch?.[2] || 'Unknown App',
        version: '0.0.0',
        description: 'No description available',
        author: repoMatch?.[1] || 'Unknown Author',
        platforms: [],
        homepage: release,
        repository: release,
        updateUrl: '',
        tags: [],
        requiredVersions: {
          server: '>=0.0.0',
          client: '>=0.0.0'
        },
        icon: '',
        size: 0,
        hash: '',
        hashAlgorithm: 'sha512',
        downloads: 0,
        updatedAt: Date.now(),
        createdAt: Date.now()
      }

      return rebuiltAppMeta
    }
  }

  private getClientLatestJson = async (
    release: ClientReleaseMeta | string
  ): Promise<ClientReleaseMeta | undefined> => {
    try {
      if (!release) throw new Error('[getClientLatestJson] Release does not exist')

      let releaseUrl: string = ''
      if (typeof release !== 'string') {
        releaseUrl = release.updateUrl
      } else {
        releaseUrl = release
      }

      // Get the initial release for the client
      const repoReleases = await this.fetchLatestRelease(releaseUrl)
      const latest = repoReleases[0]

      const latestJson = await this.fetchClientAssetContent(
        latest.assets.find((a) => a.name === 'latest.json')
      )

      if (latestJson) {
        const releaseFile = latest.assets.find((a) => a.name.includes(latestJson.id))
        if (!releaseFile) {
          logger.error(`Error finding the latest release for ${release}`, {
            function: 'getClientLatestJson',
            source: 'GithubStore',
            error: new Error('latest release not found')
          })
        }
        latestJson.downloads = releaseFile?.download_count || 0
        latestJson.createdAt = new Date(releaseFile?.created_at || '').getTime()
        latestJson.updateUrl = releaseFile?.browser_download_url || ''
      } else {
        logger.error(`Error fetching latest.json for ${release}`, {
          function: 'getClientLatestJson',
          source: 'GithubStore',
          error: new Error('latest  not found')
        })
      }

      return latestJson
    } catch (error) {
      logger.error(`Error fetching latest.json for ${release}`, {
        function: 'getClientLatestJson',
        source: 'GithubStore',
        error: error as Error
      })

      if (typeof release !== 'string') {
        return release
      }

      const repoMatch = release.match(/github\.com\/([^/]+)\/([^/]+)/)

      const rebuiltClientMeta: ClientReleaseMeta = {
        id: repoMatch?.[2] || 'Unknown',
        label: repoMatch?.[2] || 'Unknown App',
        version: '0.0.0',
        description: 'No description available',
        author: repoMatch?.[1] || 'Unknown Author',
        updateUrl: release,
        repository: release,
        requiredServer: '>=0.0.0',
        icon: '',
        size: 0,
        hash: '',
        hashAlgorithm: 'sha512',
        downloads: 0,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        short_name: 'unknown',
        builtFor: 'unknown'
      }

      return rebuiltClientMeta
    }
  }

  /**
   * Fetches the content of a GitHub asset, either from a cached version or by fetching it from the GitHub API.
   * If the asset is not found or an error occurs during the fetch, this method returns `undefined`.
   *
   * @param asset The GitHub asset to fetch the content for, or `undefined` if no asset is available.
   * @returns The content of the asset as an `AppReleaseMeta` object, or `undefined` if the content could not be fetched.
   */
  private async fetchAppAssetContent(
    asset: GithubAsset | undefined
  ): Promise<AppReleaseMeta | undefined> {
    if (!asset) return undefined
    const cached = this.assetAppCache.get(asset.browser_download_url.toLowerCase())

    if (cached && this.isCacheValid(cached)) {
      logger.debug(`Using cached asset content for ${asset.browser_download_url}`, {
        function: 'fetchAppAssetContent',
        source: 'GithubStore'
      })
      return cached.data
    }

    try {
      logger.info(`Fetching asset content for ${asset.browser_download_url}`, {
        function: 'fetchAppAssetContent',
        source: 'GithubStore'
      })
      const assetData = await fetchAssetContent<AppReleaseMeta>(asset)

      if (!assetData) {
        return undefined
      }

      this.assetAppCache.set(asset.browser_download_url.toLowerCase(), {
        timestamp: Date.now(),
        data: assetData
      })

      logger.info(`Successfully fetched asset content for ${asset.browser_download_url}`, {
        function: 'fetchAppAssetContent',
        source: 'GithubStore'
      })

      return assetData
    } catch (error) {
      logger.error('Error fetching asset content:', {
        function: 'fetchAppAssetContent',
        source: 'GithubStore',
        error: error as Error
      })
      return undefined
    }
  }

  /**
   * Fetches the content of a GitHub asset, either from a cached version or by fetching it from the GitHub API.
   * If the asset is not found or an error occurs during the fetch, this method returns `undefined`.
   *
   * @param asset The GitHub asset to fetch the content for, or `undefined` if no asset is available.
   * @returns The content of the asset as an `AppReleaseMeta` object, or `undefined` if the content could not be fetched.
   */
  private async fetchClientAssetContent(
    asset: GithubAsset | undefined
  ): Promise<ClientReleaseMeta | undefined> {
    if (!asset) return undefined
    const cached = this.assetClientCache.get(asset.browser_download_url.toLowerCase())

    if (cached && this.isCacheValid(cached)) {
      logger.info(`Using cached asset content for ${asset.browser_download_url}`, {
        function: 'fetchAppAssetContent',
        source: 'GithubStore'
      })
      return cached.data
    }

    try {
      logger.debug(`Fetching asset content for ${asset.browser_download_url}`, {
        function: 'fetchClientAssetContent',
        source: 'GithubStore'
      })
      const assetData = await fetchAssetContent<ClientReleaseMeta>(asset)

      if (!assetData) {
        return undefined
      }

      this.assetClientCache.set(asset.browser_download_url.toLowerCase(), {
        timestamp: Date.now(),
        data: assetData
      })

      logger.info(`Successfully fetched asset content for ${asset.browser_download_url}`, {
        function: 'fetchClientAssetContent',
        source: 'GithubStore'
      })

      return assetData
    } catch (error) {
      logger.error('Error fetching asset content:', {
        function: 'fetchClientAssetContent',
        source: 'GithubStore',
        error: error as Error
      })
      return undefined
    }
  }

  /**
   * Checks if the cache entry is still valid based on the current time and the cache entry's timestamp.
   * The cache is considered valid if the current time is less than 2 hours after the cache entry's timestamp.
   *
   * @param cacheEntry - The cache entry to check, containing a `timestamp` property.
   * @returns `true` if the cache entry is still valid, `false` otherwise.
   */
  private isCacheValid(cacheEntry: Record<'timestamp', number>): boolean {
    const currentTime = Date.now()
    const cacheTime = cacheEntry.timestamp
    const twoHours = 2 * 60 * 60 * 1000
    return currentTime - cacheTime < twoHours
  }

  /**
   * Fetches the releases from the github api or returns the cached data if it is still valid
   * @param repoUrl
   * @returns Promise<GithubRelease[]>
   * @throws Error when the request fails
   */
  private async fetchLatestRelease(repoUrl: string): Promise<GithubRelease[]> {
    const normalizedUrl = repoUrl.toLowerCase()

    const cacheEntry = this.cache.get(normalizedUrl)

    if (cacheEntry && this.isCacheValid(cacheEntry) && !cacheEntry.isError) {
      logger.info('Returning cached data', {
        source: 'GithubStore',
        function: 'fetchReleases'
      })
      return await cacheEntry.data
    }

    const fetchOperation = this.doFetchRelease(normalizedUrl)

    this.cache.set(repoUrl.toLowerCase(), { timestamp: Date.now(), data: fetchOperation })

    return fetchOperation
  }

  private doFetchRelease = async (repoUrl: string): Promise<GithubRelease[]> => {
    try {
      logger.debug(`Fetching latest release for ${repoUrl} from github`, {
        function: 'fetchLatestRelease',
        source: 'GithubStore'
      })
      const release = await getLatestRelease(repoUrl)

      if (!this.cachedRepos.includes(repoUrl)) {
        this.cachedRepos.push(repoUrl)
      }

      logger.info(`Got release data for ${repoUrl}`, {
        function: 'fetchLatestRelease',
        source: 'GithubStore'
      })

      this.cache.set(repoUrl, {
        timestamp: Date.now(),
        data: [release]
      })

      return [release]
    } catch (error) {
      logger.error(`Error fetching latest release: ${repoUrl}`, {
        function: 'fetchLatestRelease',
        source: 'GithubStore',
        error: error as Error
      })

      this.cache.set(repoUrl, {
        timestamp: Date.now(),
        data: [],
        isError: true
      })

      throw new Error('Error fetching latest release', { cause: error })
    }
  }
  public async getAppReferences(): Promise<AppReleaseCommunity[] | undefined> {
    return this.appReleases?.references || (await this.getAppReleaseFile()).references
  }

  public async getAppReleases(): Promise<AppReleaseMeta[] | undefined> {
    return this.appReleases?.releases || (await this.getAppReleaseFile()).releases
  }

  public async getAppRelease(
    appId: string
  ): Promise<(AppReleaseSingleMeta & { type?: string }) | undefined> {
    const releases = await this.getAppReleases()

    if (!releases) {
      return undefined
    }

    const release = releases.find((release) => {
      if (release.type === 'single') {
        return release.id === appId
      }
      if (release.type === 'multi') {
        return release.releases.some((subRelease) => subRelease.id === appId)
      }
      return false
    })

    if (release?.type === 'multi') {
      return release.releases.find((subRelease) => subRelease.id === appId)
    }

    if (release?.type === 'single') {
      return release
    }

    return undefined
  }

  /**
   * Fetches the releases from the github api or returns the cached data if it is still valid
   * Adds the repository to the appReleases object and saves it to file
   * Replaces the appReleases object in the cache with the new one
   * @param repoUrl
   * @returns {Promise<AppReleaseMeta | undefined>}
   */
  public addAppRepository = async (repoUrl: string): Promise<AppReleaseMeta | undefined> => {
    try {
      const appReleaseMeta = await this.getAppLatestJson(repoUrl)

      if (!appReleaseMeta) {
        logger.warn('Failed to update app release', {
          function: 'addAppRepository',
          source: 'GithubStore'
        })
        return
      }

      if (!this.appReleases) {
        this.appReleases = await this.getAppReleaseFile()
      }

      this.appReleases.releases = [
        appReleaseMeta,
        ...this.appReleases.releases.filter((release) => release.id !== appReleaseMeta.id)
      ]
      const reference = this.appReleases.references.find(
        (reference) => reference.repository === repoUrl
      )
      if (reference) {
        reference.added = true
      }

      await this.saveAppReleaseFile()

      logger.info('App repository added', {
        function: 'addAppRepository',
        source: 'GithubStore'
      })

      return appReleaseMeta
    } catch (error) {
      logger.error('Error adding app repository', {
        function: 'addAppRepository',
        source: 'GithubStore',
        error: error as Error
      })
      return
    }
  }

  public removeAppRelease = async (repoUrl: string): Promise<void> => {
    try {
      if (!this.appReleases) {
        this.appReleases = await this.getAppReleaseFile()
      }

      this.appReleases.releases = this.appReleases.releases.filter(
        (release) =>
          !(release.type === 'multi' || release.type === 'single') || release.repository !== repoUrl
      )

      const reference = this.appReleases.references.find(
        (reference) => reference.repository === repoUrl
      )
      if (reference) {
        reference.added = false
      }

      await this.saveAppReleaseFile()

      logger.info('App release removed successfully', {
        function: 'removeAppRelease',
        source: 'GithubStore'
      })
    } catch (error) {
      logger.error('Failed to remove app release', {
        function: 'removeAppRelease',
        source: 'GithubStore',
        error: error as Error
      })
    }
  }

  public getClientReleases = async (): Promise<ClientReleaseMeta[] | undefined> => {
    return this.clientReleases?.releases || (await this.getClientReleaseFile()).releases
  }
}

console.log('[Github Handler] Starting')
import logger from '@server/utils/logger'
import { CacheableStore, GithubAsset, CacheEntry, GithubRelease } from '@shared/types'
import { isCacheValid } from '@server/services/releases/releaseValidation'
import { GithubStoreClass } from '@shared/stores/githubStore'
import { handleError } from '@server/utils/errorHandler'

export class GithubStore implements CacheableStore, GithubStoreClass {
  initialized: boolean = false

  // Caches
  private jsonCache?: Map<string, CacheEntry<object>>
  private releaseCache?: Map<string, CacheEntry<GithubRelease[]>>
  private validationCache?: Map<string, { isValid: Promise<boolean> | boolean; timestamp: number }>

  // Queues
  private fetchQueue = new Map<string, Promise<Response>>()

  // Rate limiting
  private rateLimitReset = 0
  private retryAfter = 0
  private readonly maxRetries = 3
  private readonly baseRetryDelay = 60000 // 1 minute in milliseconds
  private readonly maxCacheSize = 1000

  initialize = async (): Promise<void> => {
    this.initialized = true
  }

  // Enforced by Cacheable Store Interface
  public saveToFile = async (): Promise<void> => {
    return
  }

  // Enforced by Cacheable Store Interface
  public clearCache = async (): Promise<void> => {
    this.cleanupExpiredEntries()
    this.releaseCache?.clear()
    this.releaseCache = undefined
    this.jsonCache?.clear()
    this.jsonCache = undefined
    this.validationCache?.clear()
    this.validationCache = undefined
    logger.info('All caches cleared', { source: 'githubStore' })
  }

  private cleanupExpiredEntries(): void {
    // Clean release cache
    if (this.releaseCache) {
      for (const [key, entry] of this.releaseCache.entries()) {
        if (!isCacheValid(entry)) {
          this.releaseCache.delete(key)
        }
      }
    }

    // Clean JSON cache
    if (this.jsonCache) {
      for (const [key, entry] of this.jsonCache.entries()) {
        if (!isCacheValid(entry)) {
          this.jsonCache.delete(key)
        }
      }
    }

    // Clean validation cache
    if (this.validationCache) {
      for (const [key, entry] of this.validationCache.entries()) {
        if (!isCacheValid(entry)) {
          this.validationCache.delete(key)
        }
      }
    }

    // Enforce cache size limits
    this.enforceCacheSizeLimit()
  }

  private enforceCacheSizeLimit(): void {
    if (this.releaseCache && this.releaseCache.size > this.maxCacheSize) {
      const entries = Array.from(this.releaseCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, entries.length - this.maxCacheSize)

      // Delete all the old ones
      toDelete.forEach(([key]) => this.releaseCache?.delete(key))
    }

    if (this.jsonCache && this.jsonCache.size > this.maxCacheSize) {
      const entries = Array.from(this.jsonCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      // Delete the oldest ones
      const toDelete = entries.slice(0, entries.length - this.maxCacheSize)
      toDelete.forEach(([key]) => this.jsonCache?.delete(key))
    }
  }

  /**
   * Handle rate limiting for requests
   * @param response - The response object from the request
   * @param retryCount - The number of times the request has been retried
   */
  private async handleRateLimit(response: Response, retryCount: number): Promise<void> {
    const resetTime = parseInt(response.headers.get('x-ratelimit-reset') || '0', 10)
    const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10)

    if (retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded for rate-limited request')
    }

    let waitTime = 0
    if (response.headers.get('x-ratelimit-remaining') === '0' && resetTime > 0) {
      // GitHub rate limit reset time (Unix timestamp)
      waitTime = Math.max(0, resetTime * 1000 - Date.now())
    } else if (retryAfter > 0) {
      // Retry-After header (seconds)
      waitTime = retryAfter * 1000
    } else {
      // Exponential backoff fallback
      waitTime = Math.min(this.baseRetryDelay * Math.pow(2, retryCount), 3600000) // Max 1 hour
    }

    this.rateLimitReset = Date.now() + waitTime
    this.retryAfter = waitTime

    logger.warn(
      `Rate limit hit. Waiting ${waitTime}ms before retry. Attempt ${retryCount + 1}/${this.maxRetries}`,
      {
        function: 'handleRateLimit',
        source: 'githubStore'
      }
    )

    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }

  private async queueRequest(url: string, options?: RequestInit): Promise<Response> {
    if (this.fetchQueue.has(url)) {
      const sharedResponse = (await this.fetchQueue.get(url)) as Response
      return sharedResponse.clone()
    }

    const request = (async () => {
      let retryCount = 0
      while (retryCount < this.maxRetries) {
        try {
          if (Date.now() < this.rateLimitReset) {
            await new Promise((resolve) => setTimeout(resolve, this.retryAfter))
          }

          const response = await fetch(url, {
            ...options,
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'DeskThing-Server',
              ...options?.headers
            }
          })

          if (response.status === 403 || response.status === 429) {
            await this.handleRateLimit(response, retryCount)
            retryCount++
            continue
          }

          this.fetchQueue.delete(url)
          return response
        } catch (error) {
          this.fetchQueue.delete(url)
          throw error
        }
      }
      this.fetchQueue.delete(url)
      throw new Error('Maximum retry attempts exceeded')
    })()
    this.fetchQueue.set(url, request)
    return request
  }

  public getLatestRelease = async (
    repoUrl: string,
    force?: boolean
  ): Promise<GithubRelease | undefined> => {
    const releases = await this.getAllReleases(repoUrl, force)
    return releases[0]
  }

  /**
   * Converts a GitHub repository URL to the API releases endpoint
   * @param repoUrl - The GitHub repository URL (e.g., https://github.com/user/repo)
   * @returns The API endpoint for releases
   */
  private convertToApiUrl(repoUrl: string): string {
    try {
      // Handle different URL formats
      const cleanUrl = repoUrl.replace(/\/$/, '') // Remove trailing slash

      // Extract owner and repo from URL
      let owner, repo

      // Check if the input is already an API URL
      const apiMatch = cleanUrl.match(/api\.github\.com\/repos\/([^/]+)\/([^/]+)/)
      if (apiMatch) {
        ;[, owner, repo] = apiMatch
      } else {
        // Extract from regular GitHub URL
        const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
        if (!match) {
          throw new Error(`Invalid GitHub repository URL: ${repoUrl}`)
        }
        ;[, owner, repo] = match
      }

      return `https://api.github.com/repos/${owner}/${repo}/releases`
    } catch (error) {
      logger.error(`Failed to convert repository URL to API endpoint: ${repoUrl}`, {
        function: 'convertToApiUrl',
        source: 'githubStore',
        error: error as Error
      })
      throw error
    }
  } /**
   * Fetches all releases for the specified GitHub repository.
   *
   * @param repoUrl - The URL of the GitHub repository.
   * @returns A Promise that resolves to an array of the latest releases for the repository.
   * @throws {Error} If the GitHub repository URL is invalid or there is an error fetching the release information.
   */
  public getAllReleases = async (repoUrl: string, force?: boolean): Promise<GithubRelease[]> => {
    try {
      const apiUrl = this.convertToApiUrl(repoUrl)
      logger.debug(`Converted url ${repoUrl} to ${apiUrl}`)

      // Checking the cache first
      const result = this.checkCache(apiUrl)
      if (result && result?.exists && isCacheValid(result) && !force) {
        logger.debug(`Cache hit for ${apiUrl}`, {
          function: 'getAllReleases',
          source: 'githubStore'
        })
        if (result.isError) {
          // Determine based on the error code if it is worth trying this url again
          switch (result.errorCode) {
            case 403:
            case 429:
              break // skip over and fetch as normal if it was a rate limit previously
            default:
              throw new Error(`Error fetching releases ${result.errorCode}!`)
          }
        } else {
          return result.data || []
        }
      }

      // Handle the request
      const response = await this.queueRequest(apiUrl)

      if (!response.ok) {
        const cacheData: CacheEntry<GithubRelease[]> = {
          exists: response.status !== 404,
          timestamp: Date.now(),
          data: [],
          errorCode: response.status,
          isError: true
        }
        this.addToCache(apiUrl, cacheData)
        throw new Error(`HTTP ERROR fetching ${apiUrl}: ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const cacheData: CacheEntry<GithubRelease[]> = {
        exists: true,
        timestamp: Date.now(),
        data,
        isError: false
      }
      this.addToCache(apiUrl, cacheData)
      return data
    } catch (error) {
      logger.error(`Error fetching releases ${repoUrl}. ${handleError(error)}!`, {
        function: 'getAllReleases',
        source: 'githubStore'
      })
      throw error
    }
  }

  public checkUrlValidity = async (url: string): Promise<boolean> => {
    try {
      // Check if we already validated this URL recently
      const cached = this.checkValidationCache(url)
      if (cached && isCacheValid(cached)) {
        return await cached.isValid
      }

      const isValid = new Promise<boolean>((resolve) => {
        // Using a HEAD request - more efficient for just checking existence
        fetch(url, {
          method: 'HEAD',
          // timeout to avoid hanging
          signal: AbortSignal.timeout(10000) // 10 seconds
        })
          .then((response) => {
            const isValid = response.ok

            resolve(isValid)
          })
          .catch(() => resolve(false))
      })

      // Cache validation result separately
      this.addToValidationCache(url, {
        isValid,
        timestamp: Date.now()
      })

      return await isValid
    } catch {
      return false
    }
  }

  /**
   * Downloads the asset object from the browser_download_url
   * @param asset - the github asset object
   * @throws - Error if asset is not found
   * @returns the asset json
   */
  async fetchJSONAssetContent<T extends object = object>(
    asset: GithubAsset | undefined,
    force = false
  ): Promise<T | undefined> {
    if (!asset) {
      throw new Error('Asset not found')
    }

    const cachedData = this.checkJSONCache(asset.browser_download_url)
    if (!force && cachedData && !cachedData.isError && isCacheValid(cachedData)) {
      return cachedData.data as T
    }

    const response = await this.queueRequest(asset.browser_download_url)

    if (!response.ok) {
      const cacheData: CacheEntry<GithubRelease[]> = {
        exists: response.status != 404,
        timestamp: Date.now(),
        data: [],
        isError: true,
        errorCode: response.status
      }
      this.addToCache(asset.browser_download_url, cacheData)
      throw new Error(
        `HTTP error while fetching Asset Content ${response.status}! status: ${response.statusText}`
      )
    }

    const contentType = response.headers.get('content-type') || ''
    const hasJsonContentType = contentType.includes('application/json')
    if (!hasJsonContentType) {
      // Allow JSON files by extension even if content-type is wrong
      const isJsonFile = asset.name.endsWith('.json')

      if (!hasJsonContentType && !isJsonFile) {
        throw new Error(
          `Asset for ${asset.browser_download_url} is not valid JSON!. Received ${contentType}.`
        )
      }

      const text = await response.text()

      try {
        const parsed = JSON.parse(text) as T
        return parsed
      } catch (parseError) {
        throw new Error(
          `Asset for ${asset.browser_download_url} contains invalid JSON: ${parseError}`
        )
      }
    }

    const data = await response.json()
    const cacheData: CacheEntry<T> = {
      exists: true,
      timestamp: Date.now(),
      data,
      isError: false
    }
    this.addToJSONCache(asset.browser_download_url, cacheData)
    return cacheData.data
  }

  public addToCache = (assetUrl: string, assetResult: CacheEntry<GithubRelease[]>): void => {
    if (!this.releaseCache) {
      this.releaseCache = new Map()
    }
    this.releaseCache.set(assetUrl.toLowerCase(), assetResult)
  }

  public checkCache = (assetUrl: string): CacheEntry<GithubRelease[]> | undefined => {
    return this.releaseCache?.get(assetUrl.toLowerCase())
  }

  private addToValidationCache = (
    assetUrl: string,
    assetResult: {
      isValid: boolean | Promise<boolean>
      timestamp: number
    }
  ): void => {
    if (!this.validationCache) {
      this.validationCache = new Map()
    }
    this.validationCache.set(assetUrl.toLowerCase(), assetResult)
  }

  private checkValidationCache = (
    assetUrl: string
  ):
    | {
        isValid: Promise<boolean> | boolean
        timestamp: number
      }
    | undefined => {
    return this.validationCache?.get(assetUrl.toLowerCase())
  }

  public addToJSONCache = <T extends object = object>(
    assetUrl: string,
    assetResult: CacheEntry<T>
  ): void => {
    if (!this.jsonCache) {
      this.jsonCache = new Map()
    }
    this.jsonCache.set(assetUrl.toLowerCase(), assetResult)
  }

  public checkJSONCache = <T extends object = object>(
    assetUrl: string
  ): CacheEntry<T> | undefined => {
    return this.jsonCache?.get(assetUrl.toLowerCase()) as CacheEntry<T> | undefined
  }
}

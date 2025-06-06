console.log('[Github Handler] Starting')
import logger from '@server/utils/logger'
import { CacheableStore, GithubAsset, CacheEntry, GithubRelease } from '@shared/types'
import { isCacheValid } from '@server/services/releases/releaseUtils'
import { GithubStoreClass } from '@shared/stores/githubStore'
import { handleError } from '@server/utils/errorHandler'

export class GithubStore implements CacheableStore, GithubStoreClass {
  initialized: boolean = false

  // Caches
  private jsonCache?: Map<string, CacheEntry<object>>
  private releaseCache?: Map<string, CacheEntry<GithubRelease[]>>
  private validationCache?: Map<string, { isValid: boolean; timestamp: number }>

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

  private async queueRequest(url: string, headers?: RequestInit): Promise<Response> {
    if (this.fetchQueue.has(url)) {
      return this.fetchQueue.get(url) as Promise<Response>
    }

    const request = (async () => {
      let retryCount = 0
      while (retryCount < this.maxRetries) {
        try {
          if (Date.now() < this.rateLimitReset) {
            await new Promise((resolve) => setTimeout(resolve, this.retryAfter))
          }
          const response = await fetch(url, headers)

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

  async getLatestRelease(repoUrl: string, force?: boolean): Promise<GithubRelease | undefined> {
    const releases = await this.getAllReleases(repoUrl, force)
    return releases[0]
  }

  /**
   * Fetches all releases for the specified GitHub repository.
   *
   * @param repoUrl - The URL of the GitHub repository.
   * @returns A Promise that resolves to an array of the latest releases for the repository.
   * @throws {Error} If the GitHub repository URL is invalid or there is an error fetching the release information.
   */
  async getAllReleases(repoUrl: string, force?: boolean): Promise<GithubRelease[]> {
    try {
      // Checking the cache first
      const result = this.checkCache(repoUrl)
      if (result && result?.exists && isCacheValid(result) && !force) {
        logger.debug(`Cache hit for ${repoUrl}`, {
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
      try {
        const response = await this.queueRequest(repoUrl)

        if (!response.ok) {
          const cacheData: CacheEntry<GithubRelease[]> = {
            exists: response.status !== 404,
            timestamp: Date.now(),
            data: [],
            errorCode: response.status,
            isError: true
          }
          this.addToCache(repoUrl, cacheData)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const cacheData: CacheEntry<GithubRelease[]> = {
          exists: true,
          timestamp: Date.now(),
          data,
          isError: false
        }
        this.addToCache(repoUrl, cacheData)
        return data
      } catch (error) {
        logger.error(` Error fetching releases ${repoUrl}. ${handleError(error)}!`, {
          function: 'getAllReleases',
          source: 'githubStore'
        })
      }

      return []
    } catch (error) {
      console.error('Error fetching releases:', error)
      throw error
    }
  }

  public checkUrlValidity = async (url: string): Promise<boolean> => {
    try {
      // Check if we already validated this URL recently
      const cached = this.validationCache?.get(url)
      if (cached && isCacheValid(cached)) {
        return cached.isValid
      }

      // Using a HEAD request - more efficient for just checking existence
      const response = await fetch(url, {
        method: 'HEAD',
        // timeout to avoid hanging
        signal: AbortSignal.timeout(10000) // 10 seconds
      })

      const isValid = response.ok

      // Cache validation result separately
      if (!this.validationCache) {
        this.validationCache = new Map()
      }
      this.validationCache.set(url, {
        isValid,
        timestamp: Date.now()
      })

      return isValid
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

    if (response.headers.get('content-type') !== 'application/json') {
      throw new Error(`Asset for ${asset.browser_download_url} is not valid JSON!`)
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
    this.releaseCache.set(assetUrl, assetResult)
  }

  public checkCache = (assetUrl: string): CacheEntry<GithubRelease[]> | undefined => {
    return this.releaseCache?.get(assetUrl)
  }

  public addToJSONCache = <T extends object = object>(
    assetUrl: string,
    assetResult: CacheEntry<T>
  ): void => {
    if (!this.jsonCache) {
      this.jsonCache = new Map()
    }
    this.jsonCache.set(assetUrl, assetResult)
  }

  public checkJSONCache = <T extends object = object>(
    assetUrl: string
  ): CacheEntry<T> | undefined => {
    return this.jsonCache?.get(assetUrl) as CacheEntry<T> | undefined
  }
}

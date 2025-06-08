/**
 * Various validation and sanitization logic for the releases - these should be independant and universal (mostly) for sanitizing data (i.e. filtering out unwanted parameters of an unknown object) and validation (i.e. trying to convert existing data into a known data type - using migrationUtils as needed)
 */

import {
  AppLatestJSONLatest,
  AppManifest,
  ClientLatestJSONLatest,
  ClientManifest,
  MultiReleaseJSONLatest
} from '@deskthing/types'
import { storeProvider } from '@server/stores/storeProvider'
import { handleError } from '@server/utils/errorHandler'
import logger from '@server/utils/logger'
import { GitDownloadUrl, GitRepoUrl } from '@shared/types'

/**
 * Checks if a release file is valid based on its timestamp.
 *
 * @param object - An object containing a timestamp property
 * @returns A boolean indicating whether the release file is considered valid (created within the last 24 hours)
 */
export const isCacheValid = (object: { timestamp: number }): boolean => {
  return object.timestamp > Date.now() - 1000 * 60 * 60 * 24
}

/**
 * Finds a valid github URL
 * @param urls - An array of possible github URLs
 * @returns A valid github URL
 */
export const determineValidUrl = async (urls: string[]): Promise<GitRepoUrl> => {
  const githubStore = await storeProvider.getStore('githubStore')
  const validUrls: GitRepoUrl[] = []

  // First pass checks if any of the URLs are valid GitHub repository URLs
  for (const url of urls) {
    const res = await githubStore.checkUrlValidity(url)
    if (res && url.includes('github.com')) {
      validUrls.push(url as GitRepoUrl)
    }
  }

  if (validUrls.length > 0) {
    return validUrls[0] as GitRepoUrl
  }

  // Try to reconstruct repository URL from various URL formats
  for (const url of urls) {
    try {
      const urlParts = url.split('/')
      let owner: string | undefined = undefined
      let repo: string | undefined = undefined

      if (url.includes('api.github.com')) {
        // Handle API URLs
        const repoIndex = urlParts.findIndex((part) => part === 'repos' || part === 'repository')
        if (repoIndex !== -1) {
          owner = urlParts[repoIndex + 1]
          repo = urlParts[repoIndex + 2]
        }
      } else if (url.includes('github.com')) {
        // Handle direct GitHub URLs
        const githubIndex = urlParts.findIndex((part) => part === 'github.com')
        if (githubIndex !== -1) {
          owner = urlParts[githubIndex + 1]
          repo = urlParts[githubIndex + 2]
        }
      }

      if (owner && repo) {
        return `https://api.github.com/repos/${owner}/${repo}/releases`
      }
    } catch (error) {
      handleError(error)
    }
  }

  throw new Error('No valid GitHub repository URL found')
}

/**
 * Determines whether or not an update url (i.e. a url that needs to get a .zip resource) is valid or not.
 * @param urls - An array of possible update URLs
 * @param fileId - The ID of the file to download
 * @returns A valid update URL
 */
export const determineValidUpdateUrl = async (
  urls: string[],
  fileId: string
): Promise<GitDownloadUrl> => {
  const githubStore = await storeProvider.getStore('githubStore')
  const validUrls: string[] = []

  // First pass checks if any of the URLs are valid and do point to the zip file (i.e. includes the fileId and ends in .zip)
  for (const url of urls) {
    const res = await githubStore.checkUrlValidity(url)
    if (res && url.includes(fileId) && url.toLowerCase().endsWith('.zip')) {
      validUrls.push(url)
    }
  }

  if (validUrls.length > 0) {
    return validUrls[0] as GitDownloadUrl
  }

  let index = 0
  // Reconstruction logic for missing download URL
  for (const url of urls) {
    try {
      index++
      // Extract owner and repo from URL
      const urlParts = url.split('/')
      let owner, repo

      if (url.includes('api.github.com')) {
        // Handle API URLs
        const repoIndex = urlParts.findIndex((part) => part === 'repos' || part === 'repository')
        if (repoIndex !== -1) {
          owner = urlParts[repoIndex + 1]
          repo = urlParts[repoIndex + 2]
        }
      } else if (url.includes('github.com')) {
        // Handle direct GitHub URLs
        const githubIndex = urlParts.findIndex((part) => part === 'github.com')
        if (githubIndex !== -1) {
          owner = urlParts[githubIndex + 1]
          repo = urlParts[githubIndex + 2]
        }
      } else {
        logger.debug(`Invalid URL: ${url} ${index}/${urls.length}`)
      }

      if (!owner || !repo) continue

      // Get latest release
      const latestRelease = await githubStore.getLatestRelease(owner, repo)
      if (!latestRelease?.assets) continue

      // Find matching asset
      const asset = latestRelease.assets.find(
        (a) => a.name.includes(fileId) && a.name.toLowerCase().endsWith('.zip')
      )

      if (asset?.browser_download_url) {
        const reconstructedUrl = asset.browser_download_url
        const isValid = await githubStore.checkUrlValidity(reconstructedUrl)

        if (isValid) {
          return reconstructedUrl as GitDownloadUrl
        } else {
          logger.debug(`Invalid URL: ${url} ${index}/${urls.length}`)
        }
      }
    } catch (error) {
      logger.debug(`Invalid URL: ${url} ${index}/${urls.length}. ${handleError(error)}`)
      continue
    }
  }

  throw new Error('No valid download URL found for the specified asset')
}

/**
 * Sanitizes the release meta - no internet fetches for validation. Simply checks that all of the values are there
 * IMPORTANT - this will not MIGRATE and will rather sanitize to assert it is the same
 * @param asset - The asset to sanitize. Should be a JSON type and not a Server or File type
 * @throws Will throw an error if the asset is not a valid JSON type
 * @returns The sanitized asset
 */
export const sanitizeLatestJSON = (
  asset: unknown
): AppLatestJSONLatest | MultiReleaseJSONLatest | ClientLatestJSONLatest => {
  if (!asset || typeof asset !== 'object') {
    throw new Error('Asset must be an object')
  }

  if (!('meta_type' in asset)) {
    throw new Error('Asset must have meta_type')
  }

  const typedAsset = asset as Partial<
    MultiReleaseJSONLatest | ClientLatestJSONLatest | AppLatestJSONLatest
  >

  switch (typedAsset.meta_type) {
    case 'multi':
      return sanitizeLatestMultiJSON(typedAsset)
    case 'client':
      return sanitizeLatestClientJSON(typedAsset)
    case 'app':
      return sanitizeLatestAppJSON(typedAsset)
    default:
      throw new Error(`Asset meta_type is not supported: ${asset.meta_type}`)
  }
}

/**
 * Sanitizes a multi-release JSON asset
 * @param asset - The asset to sanitize. Should be a JSON type and not a Server or File type
 * @throws Will throw an error if the asset is not a valid JSON type
 * @returns The sanitized asset
 */
export const sanitizeLatestMultiJSON = (
  typedAsset: Partial<MultiReleaseJSONLatest>
): MultiReleaseJSONLatest => {
  if (!('repository' in typedAsset)) {
    throw new Error('Asset must have repository')
  }

  if (!('fileIds' in typedAsset) || !Array.isArray(typedAsset.fileIds)) {
    logger.warn(`fileIds not found in ${typedAsset.meta_version}, setting to []`)
    typedAsset.fileIds = []
  }

  if (!('repositories' in typedAsset) || !Array.isArray(typedAsset.repositories)) {
    logger.warn(`repositories not found in ${typedAsset.meta_version}, setting to []`)
    typedAsset.repositories = []
  }

  return {
    meta_version: '0.11.8',
    meta_type: 'multi',
    repository: typedAsset.repository as GitRepoUrl,
    fileIds: typedAsset.fileIds || [],
    repositories: typedAsset.repositories || []
  }
}

/**
 * Sanitizes a client-release JSON asset
 * @param asset - The asset to sanitize. Should be a JSON type and not a Server or File type
 * @throws Will throw an error if the asset is not a valid JSON type
 * @returns The sanitized asset
 */
export const sanitizeLatestClientJSON = (
  typedAsset: Partial<ClientLatestJSONLatest>
): ClientLatestJSONLatest => {
  if (!('clientManifest' in typedAsset)) {
    throw new Error('Asset must contain clientManifest')
  }

  if (!('repository' in typedAsset)) {
    throw new Error('Asset must contain repository')
  }

  if (!('updateUrl' in typedAsset)) {
    throw new Error('Asset must contain updateUrl')
  }

  if (!('downloads' in typedAsset)) {
    logger.warn(`downloads not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.downloads = 0
  }

  if (!('size' in typedAsset)) {
    logger.warn(`size not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.size = 0
  }

  if (!('updatedAt' in typedAsset)) {
    logger.warn(`updatedAt not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.updatedAt = Date.now()
  }

  if (!('createdAt' in typedAsset)) {
    logger.warn(`createdAt not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.createdAt = Date.now()
  }

  return {
    meta_version: '0.11.8',
    meta_type: 'client',
    clientManifest: typedAsset.clientManifest as ClientManifest,
    icon: 'icon' in typedAsset ? (typedAsset.icon as string) : undefined,
    hash: 'hash' in typedAsset ? (typedAsset.hash as string) : undefined,
    hashAlgorithm:
      'hashAlgorithm' in typedAsset ? (typedAsset.hashAlgorithm as string) : undefined,
    repository: typedAsset.repository as GitRepoUrl,
    updateUrl: typedAsset.updateUrl as string,
    downloads: typedAsset.downloads as number,
    updatedAt: typedAsset.updatedAt as number,
    createdAt: typedAsset.createdAt as number,
    size: typedAsset.size as number
  }
}

/**
 * Sanitizes a app-release JSON asset
 * @param asset - The asset to sanitize. Should be a JSON type and not a Server or File type
 * @throws Will throw an error if the asset is not a valid JSON type
 * @returns The sanitized asset
 */
export const sanitizeLatestAppJSON = (
  typedAsset: Partial<AppLatestJSONLatest>
): AppLatestJSONLatest => {
  if (!('appManifest' in typedAsset)) {
    throw new Error('Asset must contain appManifest')
  }

  if (!('repository' in typedAsset)) {
    throw new Error('Asset must contain repository')
  }

  if (!('updateUrl' in typedAsset)) {
    throw new Error('Asset must contain updateUrl')
  }

  if (!('downloads' in typedAsset)) {
    logger.warn(`downloads not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.downloads = 0
  }

  if (!('size' in typedAsset)) {
    logger.warn(`size not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.size = 0
  }

  if (!('updatedAt' in typedAsset)) {
    logger.warn(`updatedAt not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.updatedAt = Date.now()
  }

  if (!('createdAt' in typedAsset)) {
    logger.warn(`createdAt not found in ${typedAsset.meta_version}, setting to 0`)
    typedAsset.createdAt = Date.now()
  }

  return {
    meta_version: '0.11.8',
    meta_type: 'app',
    appManifest: typedAsset.appManifest as AppManifest,
    icon: 'icon' in typedAsset ? (typedAsset.icon as string) : undefined,
    hash: 'hash' in typedAsset ? (typedAsset.hash as string) : undefined,
    hashAlgorithm: 'hashAlgorithm' in typedAsset ? (typedAsset.hashAlgorithm as string) : undefined,
    repository: typedAsset.repository as GitRepoUrl,
    updateUrl: typedAsset.updateUrl as string,
    downloads: typedAsset.downloads as number,
    updatedAt: typedAsset.updatedAt as number,
    createdAt: typedAsset.createdAt as number,
    size: typedAsset.size as number
  }
}
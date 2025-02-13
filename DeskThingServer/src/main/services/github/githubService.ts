console.log('[Github Handler] Starting')
import logger from '@server/utils/logger'
import { GithubAsset, GithubRelease } from '@shared/types'

/**
 * Fetches the latest release information for the specified GitHub repository.
 *
 * @param repoUrl - The URL of the GitHub repository.
 * @returns A Promise that resolves to the latest release information for the repository.
 * @throws {Error} If the GitHub repository URL is invalid or there is an error fetching the release information.
 */
export async function getLatestRelease(repoUrl: string): Promise<GithubRelease> {
  try {
    // Extract the owner and repo from the URL
    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL')
    }

    logger.info(`Fetching latest release for ${repoUrl}`, {
      function: 'getLatestRelease',
      source: 'githubService'
    })

    const owner = repoMatch[1]
    const repo = repoMatch[2]

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(
        `HTTP error while getting latest release ${response.status}! status: ${response.statusText}`
      )
    }

    const release = await response.json()
    return release
  } catch (error) {
    logger.error('Error while getting latest release!', {
      error: error as Error,
      function: 'getLatestRelease',
      source: 'githubService'
    })
    throw error
  }
}

/**
 * Fetches the latest releases for the specified GitHub repository.
 *
 * @param repoUrl - The URL of the GitHub repository.
 * @returns A Promise that resolves to an array of the latest releases for the repository.
 * @throws {Error} If the GitHub repository URL is invalid or there is an error fetching the release information.
 */
export async function getReleases(repoUrl: string): Promise<GithubRelease[]> {
  try {
    // Extract the owner and repo from the URL
    const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL')
    }

    const owner = repoMatch[1]
    const repo = repoMatch[2]

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(
        `HTTP error while getting releases ${response.status}! status: ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching releases:', error)
    throw error
  }
}

/**
 *
 * @param asset
 * @throws - Error if asset is not found
 * @returns
 */
export async function fetchAssetContent<T>(asset: GithubAsset | undefined): Promise<T | undefined> {
  if (!asset) {
    throw new Error('Asset not found')
  }
  const response = await fetch(asset.browser_download_url)
  if (!response.ok) {
    throw new Error(
      `HTTP error while fetching Asset Content ${response.status}! status: ${response.statusText}`
    )
  }
  return response.json()
}

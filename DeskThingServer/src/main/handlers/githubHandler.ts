console.log('[Github Handler] Starting')
import { GithubRelease } from '@shared/types'

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

    const owner = repoMatch[1]
    const repo = repoMatch[2]

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const release = await response.json()
    return release
  } catch (error) {
    console.error('Error fetching latest release:', error)
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
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching releases:', error)
    throw error
  }
}

console.log('[Github Handler] Starting')
import { GithubRelease } from '@shared/types'

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

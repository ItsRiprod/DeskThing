export type GithubAsset = {
  url: string
  id: number
  node_id: string
  name: string
  label: string
  uploader: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
  }
  content_type: string
  state: string
  size: number
  download_count: number
  created_at: string
  updated_at: string
  browser_download_url: string
}

export type GithubRelease = {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  author: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
  }
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
  assets: GithubAsset[]
  tarball_url: string
  zipball_url: string
  body: string
}

interface CacheEntry {
  timestamp: number
  data: GithubRelease[]
}

class GithubStore {
  private cache: Map<string, CacheEntry> = new Map()
  private static instance: GithubStore
  static getInstance(): GithubStore {
    if (!GithubStore.instance) {
      GithubStore.instance = new GithubStore()
    }
    return GithubStore.instance
  }
  // Check if it has been more than an hour since the last request
  private isCacheValid(cacheEntry: CacheEntry): boolean {
    const currentTime = Date.now()
    const cacheTime = cacheEntry.timestamp
    const twoHours = 1 * 60 * 60 * 1000

    return currentTime - cacheTime < twoHours
  }

  // Gets the release from github and caches it
  async fetchReleases(repoUrl: string): Promise<GithubRelease[]> {
    const cacheEntry = this.cache.get(repoUrl)

    if (cacheEntry && this.isCacheValid(cacheEntry)) {
      console.log('Returning cached data')
      return cacheEntry.data
    }

    const releases = await window.electron.fetchReleases(repoUrl)

    this.cache.set(repoUrl, { timestamp: Date.now(), data: releases })
    return releases
  }
}

export default GithubStore.getInstance()

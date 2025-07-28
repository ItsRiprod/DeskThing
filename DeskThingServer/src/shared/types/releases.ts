import {
  AppLatestJSONLatest,
  AppReleaseCommunity,
  AppReleaseMeta,
  ClientLatestJSONLatest,
  ClientManifest,
  ClientReleaseMeta
} from '@deskthing/types'

export type CacheEntry<T> = {
  timestamp: number
  data?: T | Promise<T>
  isError?: boolean
  errorCode?: number
  exists: boolean
}

export type RefreshOptions = {
  /** Whether to force a refresh of stats */
  force?: boolean
  /** Whether to update the stats */
  updateStates?: boolean
}

export type ClientDownloadReturnData = {
  message: string
} & (
  | {
      success: true
      clientManifest: ClientManifest
    }
  | {
      success: false
      clientManifest?: ClientManifest
    }
)

// Extracted union of the versions
export type AppReleaseFile = AppReleaseFile01111 | AppReleaseFile0118 | AppReleaseFile0108

// Extracted union of the versions
export type ClientReleaseFile =
  | ClientReleaseFile01111
  | ClientReleaseFile0118
  | ClientReleaseFile0108

export type AppReleaseFile01111 = {
  version: '0.11.11'
  type: 'app'
  repositories: string[]
  releases: AppLatestServer[]
  timestamp: number
}

export type ClientReleaseFile01111 = {
  version: '0.11.11'
  type: 'client'
  /**
   * The array of repositories that are available to be used
   */
  repositories: string[]
  /**
   * The array of releases to choose from
   */
  releases: ClientLatestServer[]
  timestamp: number
}

/**
 * @deprecated - use AppReleaseFile01111
 */
export type AppReleaseFile0118 = {
  /**
   * @deprecated - use 0.11.11 (latest)
   */
  version: '0.11.8'
  type: 'app'
  repositories: string[]
  releases: AppLatestServer[]
  timestamp: number
}

/**
 * @deprecated - use ClientReleaseFile01111
 */
export type ClientReleaseFile0118 = {
  /**
   * @deprecated - use 0.11.11 (latest)
   */
  version: '0.11.8'
  type: 'client'
  /**
   * The array of repositories that are available to be used
   */
  repositories: string[]
  /**
   * The array of releases to choose from
   */
  releases: ClientLatestServer[]
  timestamp: number
}

/**
 * The client latest object to be used by the server
 */
export type ClientLatestServer = {
  id: string
  type: 'client'
  mainRelease: ClientLatestJSONLatest
  lastUpdated: number
  totalDownloads: number
  pastReleases?: PastReleaseInfo[]
}

/**
 * The app latest object to be used by the server
 * This object is stored in the file system and is never stored up on, say, github. This is a wrapper for each app that will collect all of the past releases as well
 */
export type AppLatestServer = {
  id: string
  type: 'app'
  mainRelease: AppLatestJSONLatest
  lastUpdated: number
  totalDownloads: number
  pastReleases?: PastReleaseInfo[]
}

/**
 * The outdated version of the release file used for legacy migrations
 * @deprecated - use 0.11.8
 */
export type AppReleaseFile0108 = {
  /**
   * @deprecated - use 0.11.11 (latest)
   */
  version: '0.10.0'
  repositories: string[]
  references: AppReleaseCommunity[]
  releases: AppReleaseMeta[]
  timestamp: number
}

export type PastReleaseInfo = {
  tag: string
  downloads: number
  size: number
  name: string
  download_url: string
  created_at: string
}

/**
 * @deprecated - will be updated to the global types soon
 */
export type GitRepoUrl =
  | `https://api.github.com/repos/${string}/${string}`
  | `git@github.com:${string}/${string}.git`
  | `https://gitlab.com/${string}/${string}`

export type GitDownloadUrl =
  `https://api.github.com/repos/${string}/${string}/releases/download/${string}/${string}`

/**
 * The outdated version of the release file used for legacy migrations
 * @deprecated - use 0.11.8
 */
export type ClientReleaseFile0108 = {
  /**
   * @deprecated - use 0.11.11 (latest)
   */
  version: '0.10.0'
  repositories: string[]
  releases: ClientReleaseMeta[]
  timestamp: number
}

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

export interface GithubRelease {
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

export interface GithubRepository {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
  owner: {
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
    user_view_type: string
    site_admin: boolean
  }
  html_url: string
  description: string | null
  fork: boolean
  url: string
  forks_url: string
  keys_url: string
  collaborators_url: string
  teams_url: string
  hooks_url: string
  issue_events_url: string
  events_url: string
  assignees_url: string
  branches_url: string
  tags_url: string
  blobs_url: string
  git_tags_url: string
  git_refs_url: string
  trees_url: string
  statuses_url: string
  languages_url: string
  stargazers_url: string
  contributors_url: string
  subscribers_url: string
  subscription_url: string
  commits_url: string
  git_commits_url: string
  comments_url: string
  issue_comment_url: string
  contents_url: string
  compare_url: string
  merges_url: string
  archive_url: string
  downloads_url: string
  issues_url: string
  pulls_url: string
  milestones_url: string
  notifications_url: string
  labels_url: string
  releases_url: string
  deployments_url: string
  created_at: string
  updated_at: string
  pushed_at: string
  git_url: string
  ssh_url: string
  clone_url: string
  svn_url: string
  homepage: string | null
  size: number
  stargazers_count: number
  watchers_count: number
  language: string | null
  has_issues: boolean
  has_projects: boolean
  has_downloads: boolean
  has_wiki: boolean
  has_pages: boolean
  has_discussions: boolean
  forks_count: number
  mirror_url: string | null
  archived: boolean
  disabled: boolean
  open_issues_count: number
  license: null
  allow_forking: boolean
  is_template: boolean
  web_commit_signoff_required: boolean
  topics: string[]
  visibility: string
  forks: number
  open_issues: number
  watchers: number
  default_branch: string
  temp_clone_token: string | null
  network_count: number
  subscribers_count: number
}
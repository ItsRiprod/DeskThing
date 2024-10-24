// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface Client {
  ip: string
  port?: number
  hostname?: string
  headers?: Record<string, string>
  userAgent?: string
  connectionId: string
  connected: boolean
  adbId?: string
  timestamp: number
  currentApp?: string
  version?: string
  client_name?: string
  description?: string
  device_type?: { id: number; name: string }
  default_view?: string
  miniplayer?: string
}

export interface ClientManifest {
  name: string
  id: string
  short_name: string
  description: string
  builtFor: string
  reactive: boolean
  author: string
  version: string
  port: number
  ip: string
  default_view: string
  miniplayer: string
  compatible_server?: number[]
  uuid?: string
  version_code?: number
  adbId?: string
  device_type: { id: number; name: string }
}

export interface RepoReleases {
  repoUrl: string
  releases: GithubRelease[]
}

export interface SocketData {
  app: string
  type: string
  request?: string
  payload?:
    | Array<string>
    | string
    | object
    | number
    | { [key: string]: string | Array<string> }
    | Settings
}

export interface Settings {
  version: string
  version_code: number
  callbackPort: number
  devicePort: number
  address: string
  autoStart: boolean
  autoConfig: boolean
  minimizeApp: boolean
  localIp: string[]
  globalADB: boolean
  appRepos: string[]
  autoDetectADB: boolean
  clientRepos: string[]
  [key: string]: any // For any additional settings
}

export interface StatusMessage {
  message: string
  weight: number
  minimum: number
}

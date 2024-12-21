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

// The Client is how the clients are stored to keep track of them
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

// The standard manifest that all the clients should have
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

// The socket data that is used for any communication. I.e. between the app-server or server-client
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

export type SongData = {
  album: string | null
  artist: string | null
  playlist: string | null
  playlist_id: string | null
  track_name: string
  shuffle_state: boolean | null
  repeat_state: 'off' | 'all' | 'track' //off, all, track
  is_playing: boolean
  can_fast_forward: boolean // Whether or not there an an option to 'fastforward 30 sec'
  can_skip: boolean
  can_like: boolean
  can_change_volume: boolean
  can_set_output: boolean
  track_duration: number | null
  track_progress: number | null
  volume: number // percentage 0-100
  thumbnail: string | null //base64 encoding that includes data:image/png;base64, at the beginning
  device: string | null // Name of device that is playing the audio
  id: string | null // A way to identify the current song (is used for certain actions)
  device_id: string | null // a way to identify the current device if needed
  timestamp: number
  liked?: boolean
  color?: color
}
export interface color {
  value: number[]
  rgb: string
  rgba: string
  hex: string
  hexa: string
  isDark: boolean
  isLight: boolean
  error?: string
}

// The settings for the app
export interface Settings {
  version: string
  version_code: number
  callbackPort: number
  LogLevel: LOGGING_LEVEL
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
  playbackLocation?: string
  refreshInterval: number
  [key: string]: any // For any additional settings
}

// Used in the Refresh ADB screen to display little messages for the user
export interface StatusMessage {
  message: string
  weight: number
  minimum: number
}

/**
 * The MESSAGE_TYPES object defines a set of constants that represent the different types of messages that can be sent or received in the application.
 * Error, Log, Message, Warning, Fatal, and Debugging.
 */
export enum MESSAGE_TYPES {
  ERROR = 'error',
  LOGGING = 'log',
  MESSAGE = 'message',
  WARNING = 'warning',
  FATAL = 'fatal',
  DEBUG = 'debugging'
}

/**
 * The LOGGING_LEVEL object defines a set of constants that represent the different levels of logging that can be used in the application.
 * These levels are used to determine which logs should be displayed in the application.
 * The levels are: SYSTEM, APPS, and PRODUCTION.
 * The SYSTEM level is used for system-level logs, the APPS level is used for app and client emitted logs, and the PRODUCTION level is used for only errors, warnings, debugging, and fatal logs.
 */
export enum LOGGING_LEVEL {
  SYSTEM = 'system', // All system-level logs
  APPS = 'apps', // all app and client emitted logs
  PRODUCTION = 'production' // Only errors, warnings, debugging, and fatal logs
}

export interface Log {
  source: string
  type: MESSAGE_TYPES
  log: string
  trace?: string
  date?: string
}

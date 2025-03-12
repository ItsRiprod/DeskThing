// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AppReleaseCommunity,
  AppReleaseMeta,
  ClientReleaseMeta,
  LOGGING_LEVELS
} from '@deskthing/types'

export interface CacheableStore {
  clearCache: () => Promise<void>
  saveToFile: () => Promise<void>
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

export interface SortedReleases {
  [key: string]: GithubAsset[]
}

export type AppReleaseFile = {
  version: string
  references: AppReleaseCommunity[]
  releases: AppReleaseMeta[]
  timestamp: number
}

/**
 * Not currently in use!
 */
export type ClientReleaseFile = {
  version: string
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

export interface RepoReleases {
  repoUrl: string
  releases: GithubRelease[]
}

// The settings for the app
export type Settings = {
  version: string
  /** @depreciated - use semver off the main settings */
  version_code?: number
  callbackPort: number
  LogLevel: LOG_FILTER
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

export type LoggingOptions = {
  domain?: string // server or the name of the app/client
  source?: string // the function or class name
  function?: string // the method of the class or null if not in class
  error?: Error // the new Error for errors (cast unknowns as Error)
  date?: string // the current date (filled in my logger - not needed)
}

/**
 * The LOG_FILTER object defines a set of constants that represent the different levels of logging that can be used in the application.
 * These levels are used to determine which logs should be displayed in the application.
 * The levels are: SYSTEM, APPS, and PRODUCTION.
 * The SYSTEM level is used for system-level logs, the APPS level is used for app and client emitted logs, and the PRODUCTION level is used for only errors, warnings, debugging, and fatal logs.
 */
export enum LOG_FILTER {
  DEBUG = LOGGING_LEVELS.DEBUG,
  MESSAGE = LOGGING_LEVELS.MESSAGE,
  LOG = LOGGING_LEVELS.LOG,
  INFO = LOGGING_LEVELS.LOG,
  WARN = LOGGING_LEVELS.WARN,
  ERROR = LOGGING_LEVELS.ERROR,
  FATAL = LOGGING_LEVELS.FATAL,
  SILENT = 'silent',
  APPSONLY = 'appsOnly'
}

export interface Log {
  options: LoggingOptions
  type: LOGGING_LEVELS
  log: string
}

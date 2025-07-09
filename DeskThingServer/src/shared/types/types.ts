import { LOGGING_LEVELS } from '@deskthing/types'

export interface CacheableStore {
  clearCache: () => Promise<void>
  saveToFile: () => Promise<void>
}

// The settings for the app
export type Settings = {
  version: string

  // server
  server_LogLevel: LOG_FILTER
  server_autoStart: boolean
  /** Whether it should minimize to taskbar OR close on window close */
  server_minimizeApp: boolean
  server_startMinimized: boolean
  server_localIp: string[]
  server_callbackPort: number
  // device
  device_devicePort: number
  device_address: string
  // music
  music_playbackLocation?: string
  music_refreshInterval: number
  // adb
  adb_useGlobal: boolean
  adb_autoConfig: boolean
  adb_autoDetect: boolean
  adb_blacklist: string[]
  // flags
  flag_firstClose: boolean
  flag_hasOpened: boolean
  flag_collectStats: boolean
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

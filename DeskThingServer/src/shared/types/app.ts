// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task } from './tasks'
import { GithubAsset, SocketData } from './types'

export type toServer = (appData: FromAppData) => void
export type SysEvents = (event: string, listener: (...args: any[]) => void) => void
export type startData = {
  toServer: toServer
  SysEvents: SysEvents
}

export type OutgoingEvent =
  | 'message'
  | 'data'
  | 'get'
  | 'set'
  | 'callback-data'
  | 'start'
  | 'stop'
  | 'purge'
  | 'input'
  | 'action'
  | 'config'
  | 'settings'
  | 'step'
  | 'task'

/**
 * The AppInstance interface represents an instance of an app.
 * Represents the structure of the application
 */
export interface AppInstance extends App {
  func: {
    start?: () => Promise<Response>
    toClient?: (data: ToAppData) => Promise<void>
    stop?: () => Promise<Response>
    purge?: () => Promise<Response>
  }
}

// Type that setups up the expected format for data sent to and from main
export type ToClientType = (data: ToAppData) => void

export interface AuthScopes {
  [key: string]: {
    instructions: string
    label: string
    value?: string
  }
}

export type Response = {
  data: any
  status: number
  statusText: string
  request: string[]
}

export type ToAppData = {
  type: OutgoingEvent
  request?: string
  payload?: any | SocketData
}

export type FromAppData = {
  type: IncomingAppDataTypes
  request?: string
  payload?: any | AuthScopes | SocketData
}

// v0.10.4

export enum PlatformTypes {
  WINDOWS = 'windows',
  LINUX = 'linux',
  MAC = 'mac',
  MAC64 = 'mac64',
  MACARM = 'macarm',
  ANDROID = 'android',
  IOS = 'ios',
  ARM64 = 'arm64',
  X64 = 'x64'
}

export enum TagTypes {
  AUDIO_SOURCE = 'audiosource',
  SCREEN_SAVER = 'screensaver',
  UTILITY_ONLY = 'utilityOnly',
  WEB_APP_ONLY = 'webappOnly'
}

export interface AppManifest {
  id: string
  label?: string
  requires: string[]
  version: string
  description?: string
  author?: string
  platforms?: PlatformTypes[]
  homepage?: string
  repository?: string
  updateUrl?: string // Usually the same as repository
  tags: TagTypes[]
  requiredVersions: {
    server: string
    client: string
  }
  template?: string // Utility - only for the template to know what template was used
  version_code?: number // deprecated
  compatible_server?: number[] // deprecated
  compatible_client?: number[] // deprecated
  isAudioSource?: boolean // depreciated
  isScreenSaver?: boolean // depreciated
  isLocalApp?: boolean // depreciated
  isWebApp?: boolean // depreciated
}

export interface App {
  name: string
  enabled: boolean
  running: boolean
  prefIndex: number
  timeStarted: number
  meta?: AppMeta
  manifest?: AppManifest
}

export interface AppMeta {
  version: string
  verified: boolean
  verifiedManifest: boolean
  updateAvailable: boolean
  updateChecked: boolean
  updateAvailableVersion?: string
}

export interface Config {
  [appName: string]: string | string[]
}

export interface AppDataInterface {
  version: string
  settings?: AppSettings
  data?: Record<string, string>
  tasks?: { [key: string]: Task }
}

export enum SETTING_TYPES {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  RANGE = 'range',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  LIST = 'list',
  RANKED = 'ranked',
  COLOR = 'color'
}

export type SettingsNumber = {
  type: SETTING_TYPES.NUMBER
  value: number
  min: number
  max: number
  label: string
  description?: string
}

export type SettingsBoolean = {
  type: SETTING_TYPES.BOOLEAN
  value: boolean
  label: string
  description?: string
}

export type SettingsRange = {
  type: SETTING_TYPES.RANGE
  value: number
  label: string
  min: number
  max: number
  step?: number
  description?: string
}

export type SettingsString = {
  type: SETTING_TYPES.STRING
  value: string
  label: string
  maxLength?: number
  description?: string
}

export type SettingsSelect = {
  type: SETTING_TYPES.SELECT
  value: string
  label: string
  description?: string
  placeholder?: string
  options: SettingOption[]
}

export type SettingOption = {
  label: string
  value: string
}

export type SettingsRanked = {
  type: SETTING_TYPES.RANKED
  value: string[]
  label: string
  description?: string
  options: SettingOption[]
}

/**
 * Not fully implemented yet!
 */
export type SettingsList = {
  type: SETTING_TYPES.LIST
  value: string[]
  placeholder?: string
  maxValues?: number
  orderable?: boolean
  unique?: boolean
  label: string
  description?: string
  options: SettingOption[]
}

export type SettingsMultiSelect = {
  type: SETTING_TYPES.MULTISELECT
  value: string[]
  label: string
  description?: string
  placeholder?: string
  options: SettingOption[]
}

export type SettingsColor = {
  type: SETTING_TYPES.COLOR
  value: string
  label: string
  description?: string
}

export type SettingsType =
  | ({ type: SETTING_TYPES.NUMBER } & SettingsNumber)
  | ({ type: SETTING_TYPES.BOOLEAN } & SettingsBoolean)
  | ({ type: SETTING_TYPES.STRING } & SettingsString)
  | ({ type: SETTING_TYPES.SELECT } & SettingsSelect)
  | ({ type: SETTING_TYPES.MULTISELECT } & SettingsMultiSelect)
  | ({ type: SETTING_TYPES.RANGE } & SettingsRange)
  | ({ type: SETTING_TYPES.RANKED } & SettingsRanked)
  | ({ type: SETTING_TYPES.LIST } & SettingsList)
  | ({ type: SETTING_TYPES.COLOR } & SettingsColor)

export type AppSettings = Record<string, SettingsType>

export type LegacyAppData = {
  apps: App[]
  config: {
    [key: string]: string | string[]
  }
}

export type AppData = {
  [appName: string]: App
}

export interface DeskThing {
  start: ({ toServer, SysEvents }: startData) => Promise<Response>
  toClient: (data: ToAppData) => Promise<void>
  stop: () => Promise<Response>
  purge: () => Promise<Response>
  getManifest: () => Promise<Response>
}

export interface AppReturnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}

export interface SortedReleases {
  [key: string]: GithubAsset[]
}

export interface ReleaseDetails {
  name: string
  version: string
}

/**
 * App Communications
 */

// Events that can be sent back to the server
export enum IncomingAppDataTypes { // v0.10.4.2
  /**
   * Default handler for unknown or unspecified data types.
   * Will log a warning message about the unknown data type.
   */
  DEFAULT = 'default',

  /**
   * Retrieves data from the server. Supports multiple request types:
   * - 'data': Gets app-specific stored data
   * - 'config': Gets configuration (deprecated)
   * - 'settings': Gets application settings
   * - 'input': Requests user input via a form
   *
   * @remarks Use {@link DeskThing.getData}, {@link DeskThing.getConfig}, {@link DeskThing.getSettings}, or {@link DeskThing.getUserInput} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.GET, { request: 'settings' })
   */
  GET = 'get',

  /**
   * Sets data inside the server for your app that can be retrieved with DeskThing.getData()
   * Data is stored persistently and can be retrieved later.
   *
   * @remarks Use {@link DeskThing.saveData} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.SET, { payload: { key: 'value' }})
   */
  SET = 'set',

  /**
   * Deletes data inside the server for your app that can be retrieved with DeskThing.getData()
   *
   * @remarks Use {@link DeskThing.deleteSettings} or {@link DeskThing.deleteData} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.DELETE, { payload: ['key1', 'key2'] }, "settings")
   * DeskThing.sendData(SEND_TYPES.DELETE, { payload: ['key1', 'key2'] }, "data")
   */
  DELETE = 'delete',

  /**
   * Opens a URL to a specific address on the server.
   * This gets around any CORS issues that may occur by opening in a new window.
   * Typically used for authentication flows.
   *
   * @remarks Use {@link DeskThing.openUrl} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.OPEN, { payload: 'https://someurl.com' })
   */
  OPEN = 'open',

  /**
   * Sends data to the front end client.
   * Can target specific client components or send general messages.
   * Supports sending to both the main client and specific app clients.
   *
   * @remarks Use {@link DeskThing.send} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.SEND, { type: 'someData', payload: 'value' })
   */
  SEND = 'send',

  /**
   * Sends data to another app in the system.
   * Allows inter-app communication by specifying target app and payload.
   * Messages are logged for debugging purposes.
   *
   * @remarks Use {@link DeskThing.sendDataToOtherApp} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.TOAPP, { request: 'spotify', payload: { type: 'get', data: 'music' }})
   */
  TOAPP = 'toApp',

  /**
   * Logs messages to the system logger.
   * Supports multiple log levels: DEBUG, ERROR, FATAL, LOGGING, MESSAGE, WARNING
   * Messages are tagged with the source app name.
   *
   * @remarks Use {@link DeskThing.log} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.LOG, { request: 'ERROR', payload: 'Something went wrong' })
   */
  LOG = 'log',

  /**
   * Manages key mappings in the system.
   * Supports operations: add, remove, trigger
   * Keys can have multiple modes and are associated with specific apps.
   *
   * @remarks Use {@link DeskThing.registerKeyObject} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.KEY, { request: 'add', payload: { id: 'myKey', modes: ['default'] }})
   */
  KEY = 'key',

  /**
   * Manages actions in the system.
   * Supports operations: add, remove, update, run
   * Actions can have values, icons, and version information.
   *
   * @remarks
   * It is recommended to use {@link DeskThing.registerAction} instead of sending data directly.
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.ACTION, { request: 'add', payload: { id: 'myAction', name: 'My Action' }})
   */
  ACTION = 'action',

  /**
   * Manages tasks in the system.
   * Supports operations: get, update, delete, add, complete, restart, start, and end
   *
   * @remarks
   * It is recommended to use {@link DeskThing.tasks.addTask} instead of sending data directly.
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.TASK, { request: 'add', payload: { id: 'myAction', name: 'My Action' }})
   */
  TASK = 'task',

  /**
   * Manages actions in the system.
   * Supports operations: get, update, delete, add, complete, restart, start, and end
   *
   * @remarks
   * It is recommended to use {@link DeskThing.tasks.addStep} instead of sending data directly.
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.ACTION, { request: 'add', payload: { id: 'myAction', name: 'My Action' }})
   */
  STEP = 'step'
}

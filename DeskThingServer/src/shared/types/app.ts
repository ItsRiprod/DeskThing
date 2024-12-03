// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GithubAsset, SocketData } from './types'

export type OutgoingEvent =
  | 'message'
  | 'get'
  | 'set'
  | 'add'
  | 'open'
  | 'data'
  | 'toApp'
  | 'error'
  | 'log'
  | 'action'
  | 'button'
  | string
export type toServer = (appData: IncomingData) => void
export type SysEvents = (event: string, listener: (...args: any[]) => void) => void
export type startData = {
  toServer: toServer
  SysEvents: SysEvents
}

/**
 * The AppInstance interface represents an instance of an app.
 * Represents the structure of the application
 */
export interface AppInstance extends App {
  func: {
    start?: () => Promise<Response>
    toClient?: (data: IncomingData) => Promise<void>
    stop?: () => Promise<Response>
    purge?: () => Promise<Response>
  }
}

// Type that setups up the expected format for data sent to and from main
export type ToClientType = (data: IncomingData) => void

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

export type IncomingData = {
  type: OutgoingEvent
  request?: string
  payload?: any | AuthScopes | SocketData
}

export interface Manifest {
  isAudioSource: boolean
  requires: Array<string>
  label: string
  version: string
  description?: string
  author?: string
  id: string
  isWebApp: boolean
  isScreenSaver?: boolean
  isLocalApp: boolean
  platforms: Array<string>
  homepage?: string
  repository?: string
}

export interface App {
  name: string
  enabled: boolean
  running: boolean
  prefIndex: number
  manifest?: Manifest
}

export interface Config {
  [appName: string]: string | string[]
}

export interface AppDataInterface {
  [key: string]: string | AppSettings | undefined | any[]
  settings?: AppSettings
}

interface SettingsBase {
  type:
    | 'boolean'
    | 'list'
    | 'multiselect'
    | 'number'
    | 'range'
    | 'ranked'
    | 'select'
    | 'string'
    | 'color'
  label: string
  description?: string
}

export interface SettingsNumber {
  value: number
  type: 'number'
  min: number
  max: number
  label: string
  description?: string
}

export interface SettingsBoolean {
  value: boolean
  type: 'boolean'
  label: string
  description?: string
}

export interface SettingsRange {
  value: number
  type: 'range'
  label: string
  min: number
  max: number
  step?: number
  description?: string
}

export interface SettingsString {
  value: string
  type: 'string'
  label: string
  maxLength?: number
  description?: string
}

export interface SettingsSelect {
  value: string
  type: 'select'
  label: string
  description?: string
  placeholder?: string
  options: SettingOption[]
}

export type SettingOption = {
  label: string
  value: string
}

export interface SettingsRanked {
  value: string[]
  type: 'ranked'
  label: string
  description?: string
  options: SettingOption[]
}

/**
 * Not fully implemented yet!
 */
export interface SettingsList {
  value: string[]
  placeholder?: string
  maxValues?: number
  orderable?: boolean
  unique?: boolean
  type: 'list'
  label: string
  description?: string
  options: SettingOption[]
}

export interface SettingsMultiSelect {
  value: string[]
  type: 'multiselect'
  label: string
  description?: string
  placeholder?: string
  options: SettingOption[]
}

export interface SettingsColor extends SettingsBase {
  type: 'color'
  value: string
  label: string
  description?: string
  placeholder?: string
}

export type SettingsType =
  | SettingsNumber
  | SettingsBoolean
  | SettingsString
  | SettingsSelect
  | SettingsMultiSelect
  | SettingsRange
  | SettingsRanked
  | SettingsList
  | SettingsColor

export interface AppSettings {
  [key: string]: SettingsType
}

export interface AppData {
  apps: App[]
  config: Config
}

export interface DeskThing {
  start: ({ toServer, SysEvents }: startData) => Promise<Response>
  toClient: (data: IncomingData) => Promise<void>
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

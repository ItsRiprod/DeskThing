import { socketData } from '../handlers/websocketServer'

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
  payload?: any | AuthScopes | socketData
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

export interface ReturnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}

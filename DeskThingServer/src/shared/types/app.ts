// Ik this is bad practice but I don't have time to fix it right now
import { DeskThingType, App, AppManifest, EventPayload } from '@deskthing/types'

/**
 * The AppInstance interface represents an instance of an app.
 * Represents the structure of the application
 */
export interface AppInstance extends App {
  func?: DeskThingType
}

// Type that sets up the expected format for data sent to and from main
export type ToClientType = (data: EventPayload) => void

export interface Config {
  [appName: string]: string | string[]
}

export type LegacyAppData = {
  apps: App[]
  config: {
    [key: string]: string | string[]
  }
}

export type AppData = {
  [appName: string]: App
}

/**
 * @depreciated - use AppManifest instead
 */
export interface AppReturnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}

export interface ReleaseDetails {
  name: string
  version: string
}

export type StagedAppManifest = AppManifest & {
  checksumValidated: boolean
}

// Ik this is bad practice but I don't have time to fix it right now
import { App, AppManifest, AppToDeskThingData } from '@deskthing/types'

/**
 * The AppInstance interface represents an instance of an app.
 * Represents the structure of the application
 * @deprecated - use App instead
 */
export type AppInstance = App

// Type that sets up the expected format for data sent to and from main
export type ToClientType = (data: AppToDeskThingData) => void

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
 * @deprecated - use AppManifest instead
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

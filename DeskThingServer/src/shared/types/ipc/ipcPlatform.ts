import { PlatformIDs, Client, ClientManifest } from '@deskthing/types'
import { SCRIPT_IDs } from '../adb'

export type WebsocketPlatformIPC = {
  platform: PlatformIDs.WEBSOCKET
} & (
  | {
      type: 'ping'
      request?: string
      clientId: string
      data?: undefined
    }
  | {
      type: 'pong'
      request?: string
      clientId: string
      data?: string
    }
  | {
      type: 'disconnect'
      request?: string
      clientId: string
      data?: boolean
    }
  | {
      type: 'restart'
      request?: string
      data?: undefined
    }
)

export type ADBPlatformIPC = {
  platform: PlatformIDs.ADB
} & (
  | {
      type: 'get'
      request: 'manifest'
      adbId: string
      data?: ClientManifest | null
    }
  | {
      type: 'get'
      request: 'devices'
      data?: Client[]
    }
  | {
      type: 'set'
      request: 'manifest'
      manifest: Partial<ClientManifest>
      adbId: string
      data?: undefined
    }
  | {
      type: 'set'
      request: 'supervisor'
      service: string
      adbId: string
      state: boolean
      data?: boolean
    }
  | {
      type: 'set'
      request: 'brightness'
      brightness: number
      adbId: string
      data?: boolean
    }
  | {
      type: 'push'
      request: 'staged'
      adbId: string
      data?: boolean
    }
  | {
      type: 'configure'
      request: 'client'
      adbId: string
      data?: boolean
    }
  | {
      type: 'push'
      request: 'script'
      scriptId: SCRIPT_IDs
      adbId: string
      force?: boolean
      data?: string
    }
  | {
      type: 'run'
      request: 'command'
      command: string
      adbId: string
      data?: string
    }
  | {
      type: 'refresh'
      request: 'adb'
      data?: Client[]
    }
)

export type BluetoothPlatformIPC = {
  platform: PlatformIDs.BLUETOOTH
} & (
  | {
      type: 'do-something'
      request?: undefined
      data?: undefined
      payload: 'etc'
    }
  | {
      type: 'do-something'
      request?: undefined
      data?: undefined
      payload: 'etc'
    }
  | {
      type: 'do-something'
      request?: undefined
      data?: undefined
      payload: 'etc'
    }
)

export type MainProcessIPC = {
  platform: PlatformIDs.MAIN
} & (
  | {
      type: 'refresh-clients'
      request?: undefined
      data?: Client[]
    }
  | {
      type: 'initial-data'
      request?: string // the id of the client
      data?: undefined
    }
)

type BasePlatformIPC = {
  channel?: string
}

export type PlatformIPC = BasePlatformIPC &
  (WebsocketPlatformIPC | ADBPlatformIPC | BluetoothPlatformIPC | MainProcessIPC)

export type ExtractPayloadFromIPC<T extends PlatformIPC> = Extract<
  PlatformIPC,
  { type: T['type']; request?: T['request']; platform: T['platform'] }
>['data']

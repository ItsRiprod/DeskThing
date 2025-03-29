import { Client, ClientManifest } from '@deskthing/types'
import { PlatformIDs } from '@shared/stores/platformStore'

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
      type: 'set'
      request: 'manifest'
      manifest: Partial<ClientManifest>
      adbId: string
      data?: undefined
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
      scriptId: 'proxy' | 'restart'
      adbId: string
      data?: boolean
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

type BasePlatformIPC = {
  channel?: string
}

export type PlatformIPC = BasePlatformIPC &
  (WebsocketPlatformIPC | ADBPlatformIPC | BluetoothPlatformIPC)

export type ExtractPayloadFromIPC<T extends PlatformIPC> = Extract<
  PlatformIPC,
  { type: T['type']; request?: T['request']; platform: T['platform'] }
>['data']

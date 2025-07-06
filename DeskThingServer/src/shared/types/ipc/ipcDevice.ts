import type { FlashEvent } from 'flashthing'
import { FLASH_REQUEST } from '../flash'
import { IPC_HANDLERS } from './ipcTypes'
import { ThingifyApiFirmware, ThingifyApiVersion, ThingifyArchiveDownloadResult } from '../thingify'

export enum IPC_DEVICE_TYPES {
  FLASH_GET = 'flasher_get',
  FLASH_SET = 'flasher_set',
  FLASH_OPERATION = 'operation',
  THINGIFY_GET = 'thingify_get',
  THINGIFY_SET = 'thingify_set'
}

export type DeviceIPCData = {
  kind: IPC_HANDLERS.DEVICE
} & (
  | {
      type: IPC_DEVICE_TYPES.FLASH_GET
      request: FLASH_REQUEST.STEPS
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_GET
      request: FLASH_REQUEST.STATE
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_GET
      request: FLASH_REQUEST.DEVICE_SELECTION
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_SET
      request: FLASH_REQUEST.FILE_PATH
      payload: string
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_SET
      request: FLASH_REQUEST.DEVICE_SELECTION
      payload: string
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_OPERATION
      request: 'start'
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_OPERATION
      request: 'cancel'
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_OPERATION
      request: 'restart'
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_OPERATION
      request: 'unbrick'
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_GET
      request: 'firmware'
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_GET
      request: 'versions'
      payload: string
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_SET
      request: 'download'
      payload: string
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_SET
      request: 'upload'
      payload: string
    }
)

export type DeviceHandlerReturnMap = {
  [IPC_DEVICE_TYPES.FLASH_GET]: {
    [FLASH_REQUEST.STEPS]: number
    [FLASH_REQUEST.STATE]: FlashEvent
    [FLASH_REQUEST.DEVICE_SELECTION]: string[]
  }
  [IPC_DEVICE_TYPES.FLASH_SET]: {
    [FLASH_REQUEST.FILE_PATH]: string
    [FLASH_REQUEST.DEVICE_SELECTION]: string
  }
  [IPC_DEVICE_TYPES.FLASH_SET]: {
    [FLASH_REQUEST.FILE_PATH]: string
    [FLASH_REQUEST.DEVICE_SELECTION]: string
  }
  [IPC_DEVICE_TYPES.FLASH_OPERATION]: { start: void; cancel: void; restart: void; unbrick: void }
  [IPC_DEVICE_TYPES.THINGIFY_GET]: {
    firmware: ThingifyApiFirmware[] | null
    versions: ThingifyApiVersion | null
  }
  [IPC_DEVICE_TYPES.THINGIFY_SET]: { download: ThingifyArchiveDownloadResult; upload: ThingifyArchiveDownloadResult }
}

export type DeviceHandlerReturnType<
  K extends IPC_DEVICE_TYPES,
  R extends keyof DeviceHandlerReturnMap[K] = keyof DeviceHandlerReturnMap[K]
> = DeviceHandlerReturnMap[K][R]

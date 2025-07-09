import { AutoConfigResult, FLASH_REQUEST, FlashingState } from '../flash'
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
      request: 'usbmode'
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
      type: IPC_DEVICE_TYPES.FLASH_OPERATION
      request: 'driver'
    }
  | {
      type: IPC_DEVICE_TYPES.FLASH_OPERATION
      request: 'autoconfig'
      payload: number
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
      type: IPC_DEVICE_TYPES.THINGIFY_GET
      request: 'file'
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_GET
      request: 'files'
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_SET
      request: 'download'
      payload: { version: string; file: string }
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_SET
      request: 'upload'
      payload: string
    }
  | {
      type: IPC_DEVICE_TYPES.THINGIFY_SET
      request: 'file'
      payload: string
    }
)

export type DeviceHandlerReturnMap = {
  [IPC_DEVICE_TYPES.FLASH_GET]: {
    [FLASH_REQUEST.STEPS]: number | null
    [FLASH_REQUEST.STATE]: FlashingState | null
    [FLASH_REQUEST.DEVICE_SELECTION]: string[]
  }
  [IPC_DEVICE_TYPES.FLASH_SET]: {
    [FLASH_REQUEST.FILE_PATH]: string
    [FLASH_REQUEST.DEVICE_SELECTION]: string
  }
  [IPC_DEVICE_TYPES.FLASH_OPERATION]: {
    start: void
    usbmode: void
    cancel: void
    restart: void
    unbrick: void
    driver: void
    autoconfig: AutoConfigResult
  }
  [IPC_DEVICE_TYPES.THINGIFY_GET]: {
    firmware: ThingifyApiFirmware | null
    versions: ThingifyApiVersion | null
    file: string | undefined
    files: string[]
  }
  [IPC_DEVICE_TYPES.THINGIFY_SET]: {
    download: ThingifyArchiveDownloadResult
    upload: ThingifyArchiveDownloadResult
    file: string
  }
}

export type DeviceHandlerReturnType<
  K extends IPC_DEVICE_TYPES,
  R extends keyof DeviceHandlerReturnMap[K] = keyof DeviceHandlerReturnMap[K]
> = DeviceHandlerReturnMap[K][R]

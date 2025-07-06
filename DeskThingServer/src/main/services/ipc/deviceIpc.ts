import {
  DeviceHandlerReturnMap,
  DeviceHandlerReturnType,
  DeviceIPCData,
  FLASH_REQUEST,
  IPC_DEVICE_TYPES
} from '@shared/types'
import Logger from '@server/utils/logger'
import type { FlashEvent } from 'flashthing';

export const deviceHandler = async <
  T extends IPC_DEVICE_TYPES,
  R extends keyof DeviceHandlerReturnMap[T]
>(
  data: Extract<DeviceIPCData, { type: T; request?: R }>
): Promise<DeviceHandlerReturnType<T, R>> => {
  switch (data.type) {
    case IPC_DEVICE_TYPES.FLASH_GET:
      if (data.request === FLASH_REQUEST.STEPS) {
        return 1
      }
      break
    case IPC_DEVICE_TYPES.FLASH_SET:
      break
    case IPC_DEVICE_TYPES.FLASH_OPERATION:
      break
    case IPC_DEVICE_TYPES.THINGIFY_GET:
      break
    case IPC_DEVICE_TYPES.THINGIFY_SET:
      break
  }
  throw new Error('Unhandled device handler case')
}

export const clientHandler: {
  [T in IPC_DEVICE_TYPES]: <R extends keyof DeviceHandlerReturnMap[T]>(
    data: Extract<DeviceIPCData, { type: T, request: R }>
  ) => Promise<DeviceHandlerReturnType<T, R>>
} = {
  [IPC_DEVICE_TYPES.FLASH_GET]: async (data) => {
    switch (data.request) {
      case FLASH_REQUEST.STEPS:
        return 1
      case FLASH_REQUEST.STATE:
        return {} as FlashEvent
      case FLASH_REQUEST.DEVICE_SELECTION:
        return []
    }
  }
}

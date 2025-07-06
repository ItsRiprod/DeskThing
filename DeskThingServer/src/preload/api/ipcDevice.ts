import {
  DeviceHandlerReturnMap,
  DeviceHandlerReturnType,
  DeviceIPCData,
  FLASH_REQUEST,
  IPC_DEVICE_TYPES,
  IPC_HANDLERS,
  ThingifyApiFirmware,
  ThingifyApiVersion,
  ThingifyArchiveDownloadResult
} from '@shared/types'
import { ipcRenderer } from 'electron'
import type { FlashEvent } from 'flashthing'

export const device = {
  getSteps: async (): Promise<number | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_GET,
      request: FLASH_REQUEST.STEPS
    }),
  getCurrentState: async (): Promise<FlashEvent | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_GET,
      request: FLASH_REQUEST.STATE
    }),
  getAvailableDevices: async (): Promise<string[] | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_GET,
      request: FLASH_REQUEST.DEVICE_SELECTION
    }),
  setDeviceSelection: async (device: string): Promise<string> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_SET,
      request: FLASH_REQUEST.DEVICE_SELECTION,
      payload: device
    }),
  startFlash: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'start'
    }),
  cancelFlash: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'cancel'
    }),
  restartFlash: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'restart'
    }),
  runUnbrick: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'unbrick'
    }),
  getFirmwareOptions: async (): Promise<ThingifyApiFirmware[] | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_GET,
      request: 'firmware'
    }),
  getFiles: async (firmwareId: string): Promise<ThingifyApiVersion | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_GET,
      request: 'versions',
      payload: firmwareId
    }),
  downloadFile: async (fileId: string): Promise<ThingifyArchiveDownloadResult> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_SET,
      request: 'download',
      payload: fileId
    }),
  uploadFile: async (filePath: string): Promise<ThingifyArchiveDownloadResult> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_SET,
      request: 'upload',
      payload: filePath
    })

}

const sendCommand = <T extends IPC_DEVICE_TYPES, R extends keyof DeviceHandlerReturnMap[T]>(
  payload: Extract<DeviceIPCData, { type: T; request?: R }>
): Promise<DeviceHandlerReturnType<T, R>> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.DEVICE }
  return ipcRenderer.invoke(IPC_HANDLERS.DEVICE, requestPayload)
}

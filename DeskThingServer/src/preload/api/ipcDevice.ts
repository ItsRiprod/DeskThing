import {
  AutoConfigResult,
  DeviceHandlerReturnMap,
  DeviceHandlerReturnType,
  DeviceIPCData,
  FLASH_REQUEST,
  FlashingState,
  IPC_DEVICE_TYPES,
  IPC_HANDLERS,
  ThingifyApiFirmware,
  ThingifyApiVersion,
  ThingifyArchiveDownloadResult
} from '@shared/types'
import { ipcRenderer } from 'electron'

export const device = {
  // flash
  getSteps: async (): Promise<number | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_GET,
      request: FLASH_REQUEST.STEPS
    }),
  getCurrentState: async (): Promise<FlashingState | null> =>
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
  startUSBMode: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'usbmode'
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
  runAutoConfig: async (step: number): Promise<AutoConfigResult> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'autoconfig',
      payload: step
    }),

  // driver
  runDriver: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.FLASH_OPERATION,
      request: 'driver'
    }),

  // thingify
  getFirmwareOptions: async (): Promise<ThingifyApiFirmware | null> =>
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
  getStagedFile: async (): Promise<string | undefined> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_GET,
      request: 'file'
    }),
  downloadFile: async (
    versionId: string,
    fileId: string
  ): Promise<ThingifyArchiveDownloadResult | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_SET,
      request: 'download',
      payload: { version: versionId, file: fileId }
    }),
  uploadFile: async (filePath: string): Promise<ThingifyArchiveDownloadResult> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_SET,
      request: 'upload',
      payload: filePath
    }),
  getAvailableStagedFiles: async (): Promise<string[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_GET,
      request: 'files'
    }),
  selectStagedFile: async (fileName: string): Promise<string> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.THINGIFY_SET,
      request: 'file',
      payload: fileName
    })
}

const sendCommand = <T extends IPC_DEVICE_TYPES, R extends keyof DeviceHandlerReturnMap[T]>(
  payload: Extract<DeviceIPCData, { type: T; request?: R }>
): Promise<DeviceHandlerReturnType<T, R>> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.DEVICE }
  return ipcRenderer.invoke(IPC_HANDLERS.DEVICE, requestPayload)
}

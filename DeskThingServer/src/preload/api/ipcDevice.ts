import {
  DeviceHandlerReturnMap,
  DeviceIPCData,
  IPC_DEVICE_TYPES,
  IPC_HANDLERS
} from '@shared/types'
import { ipcRenderer } from 'electron'

export const device = {
  get: async (): Promise<string | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.GET
    }),
  set: async (): Promise<void> => {
    await sendCommand({
      kind: IPC_HANDLERS.DEVICE,
      type: IPC_DEVICE_TYPES.SET
    })
  }
}

const sendCommand = <T extends IPC_DEVICE_TYPES>(
  payload: Extract<DeviceIPCData, { type: T }>
): Promise<DeviceHandlerReturnMap[T]> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.DEVICE }
  return ipcRenderer.invoke(IPC_HANDLERS.DEVICE, requestPayload)
}

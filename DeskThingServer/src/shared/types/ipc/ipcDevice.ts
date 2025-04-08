import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_DEVICE_TYPES {
  GET = 'get',
  SET = 'set'
}

export type DeviceIPCData = {
  kind: IPC_HANDLERS.DEVICE
} & (
  | {
      type: IPC_DEVICE_TYPES.GET
    }
  | {
      type: IPC_DEVICE_TYPES.SET
    }
)
export type DeviceHandlerReturnMap = {
  [IPC_DEVICE_TYPES.GET]: string | null
  [IPC_DEVICE_TYPES.SET]: void
}

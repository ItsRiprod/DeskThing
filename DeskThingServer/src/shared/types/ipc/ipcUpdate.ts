import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_UPDATE_TYPES {
  CHECK = 'check',
  DOWNLOAD = 'download',
  RESTART = 'restart'
}

export type UpdateIPCData = {
  kind: IPC_HANDLERS.UPDATE
} & (
  | {
      type: IPC_UPDATE_TYPES.CHECK
    }
  | {
      type: IPC_UPDATE_TYPES.DOWNLOAD
    }
  | {
      type: IPC_UPDATE_TYPES.RESTART
    }
)

export type UpdateHandlerReturnMap = {
  [IPC_UPDATE_TYPES.CHECK]: string
  [IPC_UPDATE_TYPES.DOWNLOAD]: void
  [IPC_UPDATE_TYPES.RESTART]: void
}

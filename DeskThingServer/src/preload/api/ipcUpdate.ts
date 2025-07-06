import {
  IPC_HANDLERS,
  UpdateHandlerReturnMap,
  UpdateIPCData,
  IPC_UPDATE_TYPES
} from '@shared/types'
import { ipcRenderer } from 'electron'

export const update = {
  check: async (): Promise<string> =>
    await sendCommand({
      kind: IPC_HANDLERS.UPDATE,
      type: IPC_UPDATE_TYPES.CHECK
    }),

  download: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UPDATE,
      type: IPC_UPDATE_TYPES.DOWNLOAD
    }),

  install: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UPDATE,
      type: IPC_UPDATE_TYPES.RESTART
    })
}

const sendCommand = <T extends IPC_UPDATE_TYPES>(
  data: Extract<UpdateIPCData, { type: T }>
): Promise<UpdateHandlerReturnMap[T]> => {
  const requestPayload = { ...data, kind: IPC_HANDLERS.UPDATE }
  return ipcRenderer.invoke(IPC_HANDLERS.UPDATE, requestPayload)
}

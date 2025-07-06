import {
  FeedbackReport,
  IPC_HANDLERS,
  SystemInfo,
  FeedbackIPCData,
  FeedbackHandlerReturnMap,
  IPC_FEEDBACK_TYPES,
  FeedbackResult
} from '@shared/types'
import { ipcRenderer } from 'electron'

export const feedback = {
  submit: async (feedback: FeedbackReport): Promise<FeedbackResult> =>
    await sendCommand({
      kind: IPC_HANDLERS.FEEDBACK,
      type: IPC_FEEDBACK_TYPES.ADD_FEEDBACK,
      request: 'set',
      payload: feedback
    }),
  getSysInfo: async (): Promise<SystemInfo> =>
    await sendCommand({
      kind: IPC_HANDLERS.FEEDBACK,
      type: IPC_FEEDBACK_TYPES.GET_SYSTEM_INFO,
      request: 'get'
    })
}

const sendCommand = <T extends IPC_FEEDBACK_TYPES>(
  payload: Extract<FeedbackIPCData, { type: T }>
): Promise<FeedbackHandlerReturnMap[T]> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.FEEDBACK }
  return ipcRenderer.invoke(IPC_HANDLERS.FEEDBACK, requestPayload)
}

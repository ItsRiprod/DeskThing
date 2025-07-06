import { FeedbackReport, FeedbackResult, SystemInfo } from '../feedback'
import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_FEEDBACK_TYPES {
  ADD_FEEDBACK = 'add-feedback',
  GET_SYSTEM_INFO = 'get-system-info'
}

export type FeedbackIPCData = {
  kind: IPC_HANDLERS.FEEDBACK
} & (
  | {
      type: IPC_FEEDBACK_TYPES.ADD_FEEDBACK
      request: 'set'
      payload: FeedbackReport
    }
  | {
      type: IPC_FEEDBACK_TYPES.GET_SYSTEM_INFO
      request: 'get'
    }
)

export type FeedbackHandlerReturnMap = {
  [IPC_FEEDBACK_TYPES.ADD_FEEDBACK]: FeedbackResult
  [IPC_FEEDBACK_TYPES.GET_SYSTEM_INFO]: SystemInfo
}

export type FeedbackHandlerReturnType<K extends IPC_FEEDBACK_TYPES> = FeedbackHandlerReturnMap[K]

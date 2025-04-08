import {
  FeedbackIPCData,
  IPC_FEEDBACK_TYPES,
  FeedbackHandlerReturnMap
} from '@shared/types/ipc/ipcFeedback'
import { FeedbackService } from '@server/services/feedbackService'

export const feedbackHandler = async (
  data: FeedbackIPCData
): Promise<FeedbackHandlerReturnMap[(typeof data)['type']]> => {
  switch (data.type) {
    case IPC_FEEDBACK_TYPES.ADD_FEEDBACK:
      return await FeedbackService.sendFeedback(data.payload)
    case IPC_FEEDBACK_TYPES.GET_SYSTEM_INFO:
      return await FeedbackService.collectSystemInfo()
  }
}

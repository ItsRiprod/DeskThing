import {
  FullTaskList,
  IPC_HANDLERS,
  IPC_TASK_TYPES,
  TaskHandlerReturnMap,
  TaskIPCData
} from '@shared/types'
import { Step, Task } from '@deskthing/types'
import { ipcRenderer } from 'electron'

export const task = {
  getTaskList: async (): Promise<FullTaskList> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.GET
    }),

  stopTask: async (taskId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.STOP,
      payload: { taskId, source }
    }),

  startTask: async (taskId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.START,
      payload: { taskId, source }
    }),

  completeStep: async (taskId: string, stepId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.COMPLETE,
      payload: { taskId, stepId, source }
    }),

  completeTask: async (taskId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.COMPLETE_TASK,
      payload: { taskId, source }
    }),

  pauseTask: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.PAUSE
    }),

  nextStep: async (taskId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.NEXT,
      payload: { taskId, source }
    }),

  prevStep: async (taskId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.PREVIOUS,
      payload: { taskId, source }
    }),

  restartTask: async (taskId: string, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.RESTART,
      payload: { taskId, source }
    }),

  updateStep: async (taskId: string, newStep: Partial<Step>, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.UPDATE_STEP,
      payload: { taskId, newStep, source }
    }),

  updateTask: async (newTask: Partial<Task>, source = 'server'): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.TASK,
      type: IPC_TASK_TYPES.UPDATE_TASK,
      payload: { newTask, source }
    })
}

const sendCommand = <T extends IPC_TASK_TYPES>(
  data: Extract<TaskIPCData, { type: T }>
): Promise<TaskHandlerReturnMap[T]> => {
  const requestPayload = { ...data, kind: IPC_HANDLERS.TASK }
  return ipcRenderer.invoke(IPC_HANDLERS.TASK, requestPayload)
}

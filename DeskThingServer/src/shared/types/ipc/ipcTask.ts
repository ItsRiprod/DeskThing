import { Step, Task } from '@deskthing/types'
import { FullTaskList } from '../taskTypes'
import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_TASK_TYPES {
  COMPLETE_TASK = 'complete_task',
  START = 'start',
  STOP = 'stop',
  RESTART = 'restart',
  PREVIOUS = 'previous',
  NEXT = 'next',
  COMPLETE = 'complete',
  GET = 'get',
  PAUSE = 'pause',
  UPDATE_STEP = 'update-step',
  UPDATE_TASK = 'update-task'
}

export type TaskIPCData = {
  kind: IPC_HANDLERS.TASK
} & (
  | {
      type: IPC_TASK_TYPES.COMPLETE_TASK
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_TASK_TYPES.START
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_TASK_TYPES.STOP
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_TASK_TYPES.RESTART
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_TASK_TYPES.PREVIOUS
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_TASK_TYPES.NEXT
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_TASK_TYPES.COMPLETE
      payload: { source: string; taskId: string; stepId: string }
    }
  | {
      type: IPC_TASK_TYPES.GET
    }
  | {
      type: IPC_TASK_TYPES.PAUSE
    }
  | {
      type: IPC_TASK_TYPES.UPDATE_STEP
      payload: { source: string; taskId: string; newStep: Partial<Step> }
    }
  | {
      type: IPC_TASK_TYPES.UPDATE_TASK
      payload: { source: string; newTask: Partial<Task> }
    }
)

export type TaskHandlerReturnMap = {
  [IPC_TASK_TYPES.COMPLETE_TASK]: void
  [IPC_TASK_TYPES.START]: void
  [IPC_TASK_TYPES.STOP]: void
  [IPC_TASK_TYPES.RESTART]: void
  [IPC_TASK_TYPES.PREVIOUS]: void
  [IPC_TASK_TYPES.NEXT]: void
  [IPC_TASK_TYPES.COMPLETE]: void
  [IPC_TASK_TYPES.GET]: FullTaskList
  [IPC_TASK_TYPES.PAUSE]: void
  [IPC_TASK_TYPES.UPDATE_STEP]: void
  [IPC_TASK_TYPES.UPDATE_TASK]: void
}

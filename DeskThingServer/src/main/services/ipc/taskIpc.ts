import { TaskIPCData, TaskHandlerReturnMap, IPC_TASK_TYPES } from '@shared/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'

export const taskHandler = async (
  data: TaskIPCData
): Promise<TaskHandlerReturnMap[(typeof data)['type']]> => {
  const taskStore = await storeProvider.getStore('taskStore')

  Logger.debug(`Handling task data with type: ${data.type}`, {
    source: 'taskHandler',
    function: 'task'
  })

  switch (data.type) {
    case IPC_TASK_TYPES.GET:
      return await taskStore.getTaskList()
    case IPC_TASK_TYPES.STOP:
      await taskStore.stopTask(data.payload.source, data.payload.taskId)
      return
    case IPC_TASK_TYPES.COMPLETE:
      await taskStore.completeStep(data.payload.source, data.payload.taskId, data.payload.stepId)
      return
    case IPC_TASK_TYPES.START:
      await taskStore.startTask(data.payload.source, data.payload.taskId)
      return
    case IPC_TASK_TYPES.PAUSE:
      await taskStore.pauseTask()
      return
    case IPC_TASK_TYPES.RESTART:
      try {
        await taskStore.restartTask(data.payload.source, data.payload.taskId)
      } catch (error) {
        Logger.error(`Error restarting task: ${error}`, {
          source: 'taskHandler',
          function: 'task',
          error: error as Error
        })
      }
      return
    case IPC_TASK_TYPES.COMPLETE_TASK:
      await taskStore.completeTask(data.payload.source, data.payload.taskId)
      return
    case IPC_TASK_TYPES.NEXT:
      await taskStore.nextStep(data.payload.source, data.payload.taskId)
      return
    case IPC_TASK_TYPES.PREVIOUS:
      await taskStore.prevStep(data.payload.source, data.payload.taskId)
      return
    case IPC_TASK_TYPES.UPDATE_TASK:
      await taskStore.updateTask(data.payload.source, data.payload.newTask)
      return
    case IPC_TASK_TYPES.UPDATE_STEP:
      await taskStore.updateStep(data.payload.source, data.payload.taskId, data.payload.newStep)
      return
  }
}

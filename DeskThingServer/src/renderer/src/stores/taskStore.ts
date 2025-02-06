import { create } from 'zustand'
import { Step, TaskList } from '@shared/types/tasks'

interface NotificationStoreState {
  taskList: TaskList

  // Tasks
  removeCurrentTask: () => Promise<void>
  acceptTask: (taskId: string) => Promise<void>
  rejectTask: (taskId: string) => Promise<void>
  resolveStep: (taskId: string, stepId: string) => Promise<void>
  resolveTask: (taskId: string) => Promise<void>
  pauseTask: () => Promise<void>
  restartTask: (taskId: string) => Promise<void>
  requestTasks: () => Promise<void>
  setTaskList: (taskList: TaskList) => Promise<void>
  nextStep: (taskId: string) => Promise<void>
  prevStep: (taskId: string) => Promise<void>
  updateStep: (taskId: string, step: Partial<Step>) => Promise<void>
}

// Create Zustand store
const useTaskStore = create<NotificationStoreState>((set) => ({
  taskList: {
    version: '0.0.1',
    tasks: {}
  },

  removeCurrentTask: async (): Promise<void> => {
    set((state) => ({
      taskList: {
        ...state.taskList,
        currentTaskId: undefined
      }
    }))
  },
  // Tasks
  acceptTask: async (taskId: string): Promise<void> => {
    return window.electron.tasks.startTask(taskId)
  },
  rejectTask: async (taskId: string): Promise<void> => {
    return window.electron.tasks.stopTask(taskId)
  },
  resolveStep: async (taskId: string, stepId: string): Promise<void> => {
    return window.electron.tasks.completeStep(taskId, stepId)
  },
  resolveTask: async (taskId: string): Promise<void> => {
    return window.electron.tasks.completeTask(taskId)
  },
  restartTask: async (taskId: string): Promise<void> => {
    return window.electron.tasks.restartTask(taskId)
  },
  pauseTask: async (): Promise<void> => {
    return window.electron.tasks.pauseTask()
  },

  nextStep: async (taskId: string): Promise<void> => {
    return window.electron.tasks.nextStep(taskId)
  },
  prevStep: async (taskId: string): Promise<void> => {
    return window.electron.tasks.prevStep(taskId)
  },

  requestTasks: async (): Promise<void> => {
    const taskList = await window.electron.tasks.getTaskList()
    set(() => ({
      taskList: taskList
    }))
  },

  setTaskList: async (taskList: TaskList): Promise<void> => {
    set(() => ({
      taskList: taskList
    }))
  },

  updateStep: async (taskId, step): Promise<void> => {
    if (step.id) {
      return window.electron.tasks.updateStep(taskId, step)
    }
  }
}))

export default useTaskStore

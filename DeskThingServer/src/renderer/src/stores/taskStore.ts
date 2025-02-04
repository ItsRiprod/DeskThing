import { create } from 'zustand'
import { TaskList } from '@shared/types/tasks'

interface NotificationStoreState {
  taskList: TaskList

  // Tasks
  removeCurrentTask: () => void
  acceptTask: (taskId: string) => void
  rejectTask: (taskId: string) => void
  resolveStep: (taskId: string, stepId: string) => void
  resolveTask: (taskId: string) => void
  pauseTask: () => void
  restartTask: (taskId: string) => void
  requestTasks: () => Promise<void>
  setTaskList: (taskList: TaskList) => void
  nextStep: (taskId: string) => void
  prevStep: (taskId: string) => void
}

// Create Zustand store
const useTaskStore = create<NotificationStoreState>((set) => ({
  taskList: {
    version: '0.0.1',
    tasks: {}
  },

  removeCurrentTask: (): void => {
    set((state) => ({
      taskList: {
        ...state.taskList,
        currentTaskId: undefined
      }
    }))
  },
  // Tasks
  acceptTask: async (taskId: string): Promise<void> => {
    console.log('acceptTask', taskId)
    window.electron.tasks.startTask(taskId)
  },
  rejectTask: async (taskId: string): Promise<void> => {
    window.electron.tasks.stopTask(taskId)
  },
  resolveStep: async (taskId: string, stepId: string): Promise<void> => {
    window.electron.tasks.completeStep(taskId, stepId)
  },
  resolveTask: async (taskId: string): Promise<void> => {
    window.electron.tasks.completeTask(taskId)
  },
  restartTask: async (taskId: string): Promise<void> => {
    window.electron.tasks.restartTask(taskId)
  },
  pauseTask: async (): Promise<void> => {
    window.electron.tasks.pauseTask()
  },

  nextStep: async (taskId: string): Promise<void> => {
    window.electron.tasks.nextStep(taskId)
  },
  prevStep: async (taskId: string): Promise<void> => {
    window.electron.tasks.prevStep(taskId)
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
  }
}))

export default useTaskStore

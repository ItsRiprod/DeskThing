import { create } from 'zustand'
import { TaskList } from '@shared/types/tasks'

interface NotificationStoreState {
  taskList: TaskList

  // Tasks
  acceptTask: (taskId: string) => void
  rejectTask: (taskId: string) => void
  resolveStep: (taskId: string, stepId: string) => void
  resolveTask: (taskId: string) => void
  requestTasks: () => Promise<void>
  setTaskList: (taskList: TaskList) => void
}

// Create Zustand store
const useTaskStore = create<NotificationStoreState>((set) => ({
  taskList: {
    version: '0.0.1',
    tasks: {}
  },
  // Tasks
  acceptTask: async (taskId: string): Promise<void> => {
    window.electron.startTask(taskId)
  },
  rejectTask: async (taskId: string): Promise<void> => {
    window.electron.stopTask(taskId)
  },
  resolveStep: async (taskId: string, stepId: string): Promise<void> => {
    window.electron.completeStep(taskId, stepId)
  },
  resolveTask: async (taskId: string): Promise<void> => {
    window.electron.completeTask(taskId)
  },

  requestTasks: async (): Promise<void> => {
    const taskList = await window.electron.getTaskList()
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

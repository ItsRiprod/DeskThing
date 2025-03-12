import { create } from 'zustand'
import { Step, Task } from '@DeskThing/types'
import { FullTaskList } from '@shared/types'
interface NotificationStoreState {
  // Nested tasks first by appId then by taskId
  taskList: FullTaskList
  currentTask: { source: string; id: string } | undefined

  // Tasks
  removeCurrentTask: () => Promise<void>
  acceptTask: (taskId: string, source?: string) => Promise<void>
  rejectTask: (taskId: string, source?: string) => Promise<void>
  resolveStep: (taskId: string, stepId: string, source?: string) => Promise<void>
  resolveTask: (taskId: string, source?: string) => Promise<void>
  pauseTask: () => Promise<void>
  restartTask: (taskId: string, source?: string) => Promise<void>
  requestTasks: () => Promise<void>
  setTaskList: (taskList: FullTaskList) => Promise<void>
  setTask: (task: Task) => Promise<void>
  setCurrentTask: (curTask: { id: string; source: string }) => Promise<void>
  setAppTaskList: (source: string, taskList: Record<string, Task>) => Promise<void>
  nextStep: (taskId: string, source?: string) => Promise<void>
  prevStep: (taskId: string, source?: string) => Promise<void>
  updateStep: (taskId: string, step: Partial<Step>) => Promise<void>
}

// Create Zustand store
const useTaskStore = create<NotificationStoreState>((set) => ({
  taskList: {},
  currentTask: undefined,

  removeCurrentTask: async (): Promise<void> => {
    set((state) => ({
      ...state,
      currentTask: undefined
    }))
  },
  // Tasks
  acceptTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.tasks.startTask(taskId, source)
  },
  rejectTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.tasks.stopTask(taskId, source)
  },
  resolveStep: async (taskId: string, stepId: string, source?: string): Promise<void> => {
    return window.electron.tasks.completeStep(taskId, stepId, source)
  },
  resolveTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.tasks.completeTask(taskId, source)
  },
  restartTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.tasks.restartTask(taskId, source)
  },
  pauseTask: async (): Promise<void> => {
    return window.electron.tasks.pauseTask()
  },

  nextStep: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.tasks.nextStep(taskId, source)
  },
  prevStep: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.tasks.prevStep(taskId, source)
  },

  requestTasks: async (): Promise<void> => {
    const taskList = await window.electron.tasks.getTaskList()
    set((state) => ({
      ...state,
      taskList: taskList
    }))
  },

  setTaskList: async (taskList: FullTaskList): Promise<void> => {
    set((state) => ({
      ...state,
      taskList: taskList
    }))
  },

  setTask: async (task: Task): Promise<void> => {
    set((state) => ({
      ...state,
      taskList: {
        ...state.taskList,
        [task.source]: {
          ...state.taskList[task.source],
          [task.id]: task
        }
      }
    }))
  },

  setCurrentTask: async (curTask: { id: string; source: string }): Promise<void> => {
    set((state) => ({
      ...state,
      currentTask: curTask
    }))
  },

  setAppTaskList: async (source: string, taskList: Record<string, Task>): Promise<void> => {
    set((state) => ({
      ...state,
      taskList: {
        ...state.taskList,
        [source]: taskList
      }
    }))
  },

  updateStep: async (taskId: string, step: Partial<Step>, source?: string): Promise<void> => {
    if (step.id) {
      return window.electron.tasks.updateStep(taskId, step, source)
    }
  }
}))

export default useTaskStore

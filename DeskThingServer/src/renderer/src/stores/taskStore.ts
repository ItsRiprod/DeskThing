import { create } from 'zustand'
import { Step, Task } from '@DeskThing/types'
import { FullTaskList, IpcRendererCallback } from '@shared/types'

interface NotificationStoreState {
  // Nested tasks first by appId then by taskId
  taskList: FullTaskList
  currentTask: { source: string; id: string } | undefined
  initialized: boolean

  initialize: () => Promise<void>
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
const useTaskStore = create<NotificationStoreState>((set, get) => ({
  taskList: {},
  currentTask: undefined,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleTasks: IpcRendererCallback<'taskList'> = (_event, tasks) => {
      set((state) => ({
        ...state,
        taskList: {
          ...state.taskList,
          [tasks.source]: tasks.taskList
        }
      }))
    }

    const handleTask: IpcRendererCallback<'task'> = (_event, task) => {
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
    }

    const handleCurrentTask: IpcRendererCallback<'currentTask'> = (_event, task) => {
      set((state) => ({
        ...state,
        currentTask: task
      }))
    }

    window.electron.ipcRenderer.on('taskList', handleTasks)
    window.electron.ipcRenderer.on('task', handleTask)
    window.electron.ipcRenderer.on('currentTask', handleCurrentTask)

    const taskList = await window.electron.task.getTaskList()
    set({
      taskList,
      initialized: true
    })
  },

  removeCurrentTask: async (): Promise<void> => {
    set((state) => ({
      ...state,
      currentTask: undefined
    }))
  },
  // Tasks
  acceptTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.task.startTask(taskId, source)
  },
  rejectTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.task.stopTask(taskId, source)
  },
  resolveStep: async (taskId: string, stepId: string, source?: string): Promise<void> => {
    return window.electron.task.completeStep(taskId, stepId, source)
  },
  resolveTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.task.completeTask(taskId, source)
  },
  restartTask: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.task.restartTask(taskId, source)
  },
  pauseTask: async (): Promise<void> => {
    return window.electron.task.pauseTask()
  },

  nextStep: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.task.nextStep(taskId, source)
  },
  prevStep: async (taskId: string, source?: string): Promise<void> => {
    return window.electron.task.prevStep(taskId, source)
  },

  requestTasks: async (): Promise<void> => {
    const taskList = await window.electron.task.getTaskList()
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
      return window.electron.task.updateStep(taskId, step, source)
    }
  }
}))

export default useTaskStore

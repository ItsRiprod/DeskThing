import { create } from 'zustand'
import { Log, MESSAGE_TYPES } from '@shared/types'

export interface AuthScopes {
  [key: string]: {
    instructions: string
    label: string
    value?: string
  }
}

export interface Task {
  title: string
  description: string
  id: string
  steps?: Step[]
  status: 'pending' | 'in_progress' | 'complete' | 'error' | 'rejected'
  error?: string
  complete: boolean
}

export interface Step {
  status: boolean
  task: string
  stepId: string
}

export interface Request {
  appName: string
  scopes: AuthScopes
}

interface NotificationStoreState {
  requestQueue: Request[]
  logs: Log[]
  tasks: Task[]
  issues: Task[]
  totalTasks: number

  // Logs

  readLog: (index?: number) => void
  addLog: (log: Log) => void

  // Tasks
  resolveTask: (taskId: string) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, task: Partial<Task>) => void
  updateStep: (taskId: string, stepId: string, step: Partial<Step>) => void
  removeTask: (taskId: string) => void
  addIssue: (task: Task) => void
  updateIssue: (task: Task) => void
  removeIssue: (taskId: string) => void

  // Requests
  hasActiveRequest: (appName: string) => boolean
  getRequestByAppName: (appName: string) => Request | undefined
  resolveRequest: (requestId: string, formData: { [key: string]: string }) => Promise<void>
  addRequest: (appName: string, scopes: AuthScopes) => void
  triggerRequestDisplay: (appName: string) => void

  // Total Tasks
  calculateTotalTasks: () => void
}

// Create Zustand store
const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  requestQueue: [],
  logs: [],
  tasks: [],
  issues: [],
  totalTasks: 0,

  // Tasks

  calculateTotalTasks: async (): Promise<void> => {
    set((state) => ({
      totalTasks: state.issues.length + state.logs.length + state.requestQueue.length
    }))
  },

  // Logs

  readLog: async (index?: number): Promise<void> => {
    set((state) => {
      if (index !== undefined) {
        return { logs: state.logs.filter((_, i) => i !== index) }
      } else {
        return { logs: [] }
      }
    })
    get().calculateTotalTasks()
  },

  addLog: async (log: Log): Promise<void> => {
    if (log.type === MESSAGE_TYPES.LOGGING) return

    set((state) => ({
      logs: [log, ...state.logs]
    }))

    get().calculateTotalTasks()
  },

  // Tasks

  resolveTask: async (taskId: string): Promise<void> => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          task.status = 'complete'
          task.complete = true
        }
        return task
      })
    }))
  },

  updateStep: async (taskId: string, stepId: string, updatedStep: Partial<Step>): Promise<void> => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          task.steps = task.steps?.map((step) => {
            if (step.stepId === stepId) {
              return { ...step, ...updatedStep }
            }
            return step
          })
        }
        return task
      })
    }))
  },

  addTask: async (task: Task): Promise<void> => {
    set((state) => ({
      tasks: state.tasks.some((t) => t.id === task.id) ? state.tasks : [task, ...state.tasks]
    }))
  },

  updateTask: async (taskId: string, task: Partial<Task>): Promise<void> => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, ...task }
        }
        return t
      })
    }))
  },

  removeTask: async (taskId: string): Promise<void> => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId)
    }))
  },

  addIssue: async (task: Task): Promise<void> => {
    set((state) => ({
      issues: state.issues.some((t) => t.id === task.id) ? state.issues : [task, ...state.issues]
    }))

    get().calculateTotalTasks()
  },

  updateIssue: async (task: Task): Promise<void> => {
    set((state) => ({
      issues: state.issues.map((t) => {
        if (t.id === task.id) {
          return task
        }
        return t
      })
    }))
    get().calculateTotalTasks()
  },

  removeIssue: async (taskId: string): Promise<void> => {
    set((state) => ({
      issues: state.issues.filter((task) => task.id !== taskId)
    }))
    get().calculateTotalTasks()
  },

  // Requests

  hasActiveRequest: (appName: string): boolean => {
    return get().requestQueue.some((request) => request.appName === appName)
  },

  getRequestByAppName: (appName: string): Request | undefined => {
    return get().requestQueue.find((request) => request.appName === appName)
  },

  resolveRequest: async (requestId: string, formData: { [key: string]: string }): Promise<void> => {
    await window.electron.ping()

    set((state) => ({
      requestQueue: state.requestQueue.filter((request) => request.appName !== requestId)
    }))

    get().calculateTotalTasks()

    try {
      console.log(`Sending response for request ${requestId}`)
      window.electron.ipcRenderer.send(`user-data-response-${requestId}`, formData)
    } catch (error) {
      console.error(`Failed to send response for request ${requestId}:`, error)
    }
  },

  addRequest: async (appName: string, scopes: AuthScopes): Promise<void> => {
    const existingRequest = get().getRequestByAppName(appName)
    if (!existingRequest) {
      const newRequest: Request = { appName, scopes }
      set((state) => ({
        requestQueue: [...state.requestQueue, newRequest]
      }))

      get().calculateTotalTasks()
    }
  },

  triggerRequestDisplay: async (appName: string): Promise<void> => {
    const request = get().getRequestByAppName(appName)
    if (request) {
      // Emit event or handle display logic here
      console.log('Trigger request display', request)
    } else {
      console.warn('No request found for app:', appName)
    }
  }
}))

export default useNotificationStore

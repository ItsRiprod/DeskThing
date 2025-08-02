import { create } from 'zustand'
import { LOGGING_LEVELS, NotificationMessage } from '@deskthing/types'
import { IpcRendererCallback, Log } from '@shared/types'

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
  issues: Task[]
  initialized: boolean
  messages: Record<string, NotificationMessage>

  // Initialization
  initialize: () => Promise<void>

  // Logs
  readLog: (index?: number) => void
  addLog: (log: Log) => void

  addIssue: (task: Task) => void
  updateIssue: (task: Task) => void
  removeIssue: (taskId: string) => void

  // Requests
  hasActiveRequest: (appName: string) => boolean
  getRequestByAppName: (appName: string) => Request | undefined
  resolveRequest: (requestId: string, formData: Record<string, string>) => Promise<void>
  addRequest: (appName: string, scopes: AuthScopes) => void
  triggerRequestDisplay: (appName: string) => void

  getNotifications: () => Promise<Record<string, NotificationMessage>>
  addNotification: (notificationMessage: NotificationMessage) => void
  acknowledgeNotification: (notification: NotificationMessage) => void
}

// Create Zustand store
const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  requestQueue: [],
  logs: [],
  issues: [],
  initialized: false,
  messages: {},

  // Initialization
  initialize: async (): Promise<void> => {
    if (get().initialized) return
    set({ initialized: true })

    const handleLog: IpcRendererCallback<'log'> = (_event, log) => {
      get().addLog(log)
    }

    const handleDisplayUserForm: IpcRendererCallback<'display-user-form'> = async (
      _event,
      { requestId, scope }
    ): Promise<void> => {
      get().addRequest(requestId, scope)
    }
    const handleNotification: IpcRendererCallback<'notification:add'> = async (
      _event,
      notificationMessage
    ): Promise<void> => {
      set((state) => ({
        messages: { ...state.messages, [notificationMessage.id]: notificationMessage }
      }))
    }
    const handleNotificationList: IpcRendererCallback<'notification:list'> = async (
      _event,
      notifications
    ): Promise<void> => {
      set({ messages: notifications })
    }

    window.electron.ipcRenderer.on('notification:add', handleNotification)
    window.electron.ipcRenderer.on('notification:list', handleNotificationList)
    window.electron.ipcRenderer.on('log', handleLog)
    window.electron.ipcRenderer.on('display-user-form', handleDisplayUserForm)

    console.log('Getting notifications')
    get().getNotifications()
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
  },

  addLog: async (log: Log): Promise<void> => {
    if (
      log.type === LOGGING_LEVELS.ERROR ||
      log.type === LOGGING_LEVELS.FATAL ||
      log.type === LOGGING_LEVELS.WARN
    ) {
      set((state) => ({
        logs: [log, ...state.logs].slice(0, 99)
      }))
    }
  },

  addIssue: async (task: Task): Promise<void> => {
    set((state) => ({
      issues: state.issues.some((t) => t.id === task.id) ? state.issues : [task, ...state.issues]
    }))
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
  },

  removeIssue: async (taskId: string): Promise<void> => {
    set((state) => ({
      issues: state.issues.filter((task) => task.id !== taskId)
    }))
  },

  // Requests

  hasActiveRequest: (appName: string): boolean => {
    return get().requestQueue.some((request) => request.appName === appName)
  },

  getRequestByAppName: (appName: string): Request | undefined => {
    return get().requestQueue.find((request) => request.appName === appName)
  },

  resolveRequest: async (requestId: string, formData: Record<string, string>): Promise<void> => {
    await window.electron.utility.ping()

    set((state) => ({
      requestQueue: state.requestQueue.filter((request) => request.appName !== requestId)
    }))

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
  },

  // notifications

  getNotifications: async (): Promise<Record<string, NotificationMessage>> => {
    const notifications = await window.electron.utility.getNotifications()
    set({ messages: notifications })
    return notifications
  },
  addNotification: (notificationMessage: NotificationMessage): void => {
    set((state) => ({
      messages: { ...state.messages, [notificationMessage.id]: notificationMessage }
    }))
  },
  acknowledgeNotification: (notification: NotificationMessage): void => {
    set((state) => {
      const { [notification.id]: _, ...remainingMessages } = state.messages
      return { messages: remainingMessages }
    })
    window.electron.utility.acknowledgeNotification(notification)
  }
}))

export default useNotificationStore

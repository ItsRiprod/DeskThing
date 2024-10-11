import { create } from 'zustand'

export interface AuthScopes {
  [key: string]: {
    instructions: string
    label: string
    value?: string
  }
}

export interface Request {
  appName: string
  scopes: AuthScopes
}

interface RequestStoreState {
  requestQueue: Request[]

  hasActiveRequest: (appName: string) => boolean
  getRequestByAppName: (appName: string) => Request | undefined
  resolveRequest: (requestId: string, formData: { [key: string]: string }) => void
  addRequest: (appName: string, scopes: AuthScopes) => void
  triggerRequestDisplay: (appName: string) => void
}

// Create Zustand store
const useRequestStore = create<RequestStoreState>((set, get) => ({
  requestQueue: [],

  hasActiveRequest: (appName: string): boolean => {
    return get().requestQueue.some((request) => request.appName === appName)
  },

  getRequestByAppName: (appName: string): Request | undefined => {
    return get().requestQueue.find((request) => request.appName === appName)
  },

  resolveRequest: (requestId: string, formData: { [key: string]: string }): void => {
    set((state) => ({
      requestQueue: state.requestQueue.filter((request) => request.appName !== requestId)
    }))

    try {
      window.electron.ipcRenderer.send(`user-data-response-${requestId}`, formData)
    } catch (error) {
      console.error(`Failed to send response for request ${requestId}:`, error)
    }
  },

  addRequest: (appName: string, scopes: AuthScopes): void => {
    const newRequest: Request = { appName, scopes }
    set((state) => ({
      requestQueue: [...state.requestQueue, newRequest]
    }))
  },

  triggerRequestDisplay: (appName: string): void => {
    const request = get().getRequestByAppName(appName)
    if (request) {
      // Emit event or handle display logic here
      console.log('Trigger request display', request)
    } else {
      console.warn('No request found for app:', appName)
    }
  }
}))

export default useRequestStore

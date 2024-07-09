import { EventEmitter } from '../utility/eventEmitter'

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

interface RequestStoreEvents {
  request: Request[]
  'trigger-request-display': Request
}

class RequestStore extends EventEmitter<RequestStoreEvents> {
  private requestQueue: Request[]

  constructor() {
    super()
    this.requestQueue = []

    window.electron.ipcRenderer.on('display-user-form', this.handleDisplayUserForm.bind(this))
  }

  public hasActiveRequest(appName: string): boolean {
    return this.requestQueue.find((request) => request.appName === appName) != null
  }

  private handleDisplayUserForm(_event: any, requestId: string, fields: AuthScopes): void {
    this.addRequest(requestId, fields)
  }

  public getQueue(): Request[] {
    return this.requestQueue
  }

  public getRequestByAppName(appName: string): Request | undefined {
    return this.requestQueue.find((request) => request.appName === appName)
  }

  public resolveRequest(requestId: string, formData: { [key: string]: string }): void {
    this.requestQueue = this.requestQueue.filter((request) => request.appName !== requestId)
    this.emit('request', this.requestQueue)
    window.electron.ipcRenderer.send(`user-data-response-${requestId}`, formData)
  }

  public addRequest(appName: string, scopes: AuthScopes): void {
    this.requestQueue.push({ appName, scopes })
    this.emit('request', this.requestQueue)
  }

  public triggerRequestDisplay(appName: string): void {
    const request = this.getRequestByAppName(appName)
    if (request) {
      this.emit('trigger-request-display', request)
    } else {
      console.log('No request found for app:', appName)
    }
  }
}

export const RequestStoreInstance = new RequestStore()

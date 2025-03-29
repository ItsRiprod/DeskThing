import { BrowserWindow } from 'electron'
import {
  AppIPCData,
  ClientIPCData,
  ServerIPCData,
  UtilityIPCData,
  ProgressEvent
} from '@shared/types'
import { progressBus } from './progressBus'
import { EventEmitter } from 'events'

import logger from '@server/utils/logger'

type EventMap = {
  'app:event': [AppIPCData]
  'client:event': [ClientIPCData]
  'utility:event': [UtilityIPCData]
}

class UIEventBus extends EventEmitter<EventMap> {
  private static instance: UIEventBus
  private mainWindow: BrowserWindow | null = null

  private constructor() {
    super()
    this.setupServerEventHandler()
  }

  static getInstance(): UIEventBus {
    if (!UIEventBus.instance) {
      UIEventBus.instance = new UIEventBus()
    }
    return UIEventBus.instance
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private setupServerEventHandler(): void {
    logger.warn('Server event handler is not implemented yet!')

    progressBus.on('progress', (progressEvent: ProgressEvent) => {
      this.sendIpcData({
        type: 'progress:event',
        payload: progressEvent
      })
    })
  }

  emitAppEvent(data: AppIPCData): void {
    this.emit('app:event', data)
  }

  emitClientEvent(data: ClientIPCData): void {
    this.emit('client:event', data)
  }

  emitUtilityEvent(data: UtilityIPCData): void {
    this.emit('utility:event', data)
  }

  // Uncomment once a full event bus is implemented for the frontend in v0.12 or v1.0
  // emitServerEvent(data: ServerIPCData): void {
  //   this.emit('server:event', data)
  // }

  async sendIpcData({ type, payload, window }: ServerIPCData): Promise<void> {
    if (window && window instanceof BrowserWindow) {
      window.webContents.send(type, payload)
    } else {
      this.mainWindow?.webContents.send(type, payload)
    }
  }
}

export const uiEventBus = UIEventBus.getInstance()

import EventEmitter from 'events'
import Logger from './logger'
import { socketData } from '../handlers/websocketServer'

export const MESSAGE_TYPES = {
  ERROR: 'error',
  LOGGING: 'log',
  MESSAGE: 'message',
  CONFIG: 'config',
  SETTINGS: 'settings',
  MAPPINGS: 'mapping'
}

/* Handles server-wide announcements for certain events */
class Events extends EventEmitter {
  constructor() {
    super()
  }

  async asyncEmit(event: string, data: string | socketData | string | unknown): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(() => {
        this.emit(event, data)
        if (event == MESSAGE_TYPES.ERROR) {
          Logger.error(`Event emitted: ${event} with arguments: ${JSON.stringify(data)}`)
        } else if (event == MESSAGE_TYPES.LOGGING) {
          Logger.info(`Event emitted: ${event} with arguments: ${JSON.stringify(data)}`)
        } else {
          Logger.debug(`Event emitted: ${event} with arguments: ${JSON.stringify(data)}`)
        }
        resolve()
      })
    })
  }
}

const dataListener = new Events()

export default dataListener

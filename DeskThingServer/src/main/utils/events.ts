import EventEmitter from 'events'
import Logger from './logger'

export const MESSAGE_TYPES = {
  ERROR: 'error',
  LOGGING: 'log',
  MESSAGE: 'message',
  CONFIG: 'config',
  CONNECTION: 'connection',
  MAPPINGS: 'mapping'
}

/* Handles server-wide announcements for certain events */
class Events extends EventEmitter {
  constructor() {
    super()
  }

  async asyncEmit(event: string, ...args: any[]): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(() => {
        this.emit(event, ...args)
        if (event == MESSAGE_TYPES.ERROR) {
          Logger.error(`Event emitted: ${event} with arguments: ${JSON.stringify(args)}`)
        } else if (event == MESSAGE_TYPES.LOGGING) {
          Logger.info(`Event emitted: ${event} with arguments: ${JSON.stringify(args)}`)
        } else {
          Logger.debug(`Event emitted: ${event} with arguments: ${JSON.stringify(args)}`)
        }
        resolve()
      })
    })
  }
}

const dataListener = new Events()

export default dataListener

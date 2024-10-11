import EventEmitter from 'events'
import Logger from './logger'
import { SocketData } from '@shared/types'

/**
 * The MESSAGE_TYPES object defines a set of constants that represent the different types of messages that can be sent or received in the application.
 */
export const MESSAGE_TYPES = {
  ERROR: 'error',
  LOGGING: 'log',
  MESSAGE: 'message',
  CONFIG: 'config',
  SETTINGS: 'settings',
  MAPPINGS: 'mapping'
}

/**
 * Events is a class that extends the EventEmitter class from the 'events' module.
 */
class Events extends EventEmitter {
  constructor() {
    super()
  }

  /**
   * Emits an event with associated data to all connected clients.
   *
   * @param event - The name of the event to emit. Should be one of the MESSAGE_TYPES defined in this file.
   * @param data - The data to be sent along with the event. Can be of any type, but typically an object containing relevant information.
   * @returns void
   *
   * Usage:
   * 1. Import the Events instance from this file.
   * 2. Call the method with the appropriate event type and data.
   *
   * @example
   *
   * import { events } from './events'
   *
   * events.emit(MESSAGE_TYPES.MESSAGE, { content: 'Hello, world!' })
   */
  async asyncEmit(event: string, ...data: (string | SocketData | unknown)[]): Promise<void> {
    console.log(`[${event}] `, data)
    return new Promise((resolve) => {
      setImmediate(() => {
        // Ensure that two arguments are only emitted at once
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
          this.emit(event, data.join(' '))
        } else {
          this.emit(event, data[0])
        }

        if (event === MESSAGE_TYPES.ERROR) {
          Logger.error(`[${event}]: ${JSON.stringify(data)}`)
        } else if (event === MESSAGE_TYPES.LOGGING) {
          Logger.info(`[${event}]: ${JSON.stringify(data)}`)
        } else {
          Logger.debug(`[${event}]: ${JSON.stringify(data)}`)
        }
        resolve()
      })
    })
  }
}

const dataListener = new Events()

export default dataListener

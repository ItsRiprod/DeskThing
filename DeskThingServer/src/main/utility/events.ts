import EventEmitter from 'events'

export const MESSAGE_TYPES = {
  ERROR: 'error',
  LOGGING: 'log',
  MESSAGE: 'message',
  CONFIG: 'config',
  CONNECTION: 'connection'
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
        resolve()
      })
    })
  }
}

const dataListener = new Events()

export default dataListener

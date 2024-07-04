import EventEmitter from 'events'

export const MESSAGE_TYPES = {
  ERROR: 'error',
  LOGGING: 'log',
  MESSAGE: 'message',
  CONFIG: 'config'
}

/* Handles server-wide announcements for certain events */
class Events extends EventEmitter {
  constructor() {
    super()
  }
}

const dataListener = new Events()

export default dataListener

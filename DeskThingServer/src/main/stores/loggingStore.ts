console.log('[Logging Store] Starting')
import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { MESSAGE_TYPES, Log, LOGGING_LEVEL, Settings, ReplyData, ReplyFn } from '@shared/types'

// LoggingStore configuration
const logFile = join(app.getPath('userData'), 'application.log.json')
const readableLogFile = join(app.getPath('userData'), 'readable.log')

// Ensure log directory exists
const logDir = app.getPath('userData')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

class LoggingStore {
  private static instance: LoggingStore
  private listeners: ((data: Log) => void)[] = []
  private logs: Log[] = []
  private logLevel: LOGGING_LEVEL = LOGGING_LEVEL.SYSTEM

  private constructor() {
    fs.writeFileSync(logFile, '[]')
    fs.writeFileSync(readableLogFile, '')
    import('./settingsStore').then(({ default: settingsStore }) => {
      settingsStore.addListener(this.settingsStoreListener.bind(this))
    })
  }

  private settingsStoreListener(settings: Settings): void {
    this.logLevel = settings.logLevel
  }

  // Singleton instance
  public static getInstance(): LoggingStore {
    if (!LoggingStore.instance) {
      LoggingStore.instance = new LoggingStore()
    }
    return LoggingStore.instance
  }

  // Log a message
  async log(level: MESSAGE_TYPES, message: string, source: string = 'server'): Promise<void> {
    try {
      if (
        level === MESSAGE_TYPES.LOGGING &&
        source === 'server' &&
        this.logLevel != LOGGING_LEVEL.SYSTEM
      ) {
        return
      }

      if (level === MESSAGE_TYPES.LOGGING && this.logLevel == LOGGING_LEVEL.PRODUCTION) {
        return
      }

      const timestamp = new Date().toISOString()
      const trace = new Error().stack || ''

      const logData: Log = {
        source: source,
        type: level,
        log: message,
        trace: trace,
        date: timestamp
      }

      this.logs.push(logData)
      this.notifyListeners(logData)

      const readableTimestamp = new Date(timestamp).toLocaleString()
      const readableMessage = `[${readableTimestamp}] [${source}] ${level.toUpperCase()}: ${message}\n`

      if (level === MESSAGE_TYPES.ERROR) {
        console.log('\x1b[31m%s\x1b[0m', readableMessage) // Red for error
      } else if (level === MESSAGE_TYPES.WARNING) {
        console.log('\x1b[33m%s\x1b[0m', readableMessage) // Yellow for warning
      } else if (level === MESSAGE_TYPES.MESSAGE) {
        console.log('\x1b[32m%s\x1b[0m', readableMessage) // Green for messages
      } else if (level === MESSAGE_TYPES.LOGGING) {
        console.log('\x1b[90m%s\x1b[0m', readableMessage) // Dark gray for info
      } else if (level === MESSAGE_TYPES.FATAL) {
        console.log('\x1b[35m%s\x1b[0m', readableMessage) // Magenta for fatal
      } else if (level === MESSAGE_TYPES.DEBUG) {
        console.log('\x1b[34m%s\x1b[0m', readableMessage) // Blue for debug
      } else {
        console.log('\x1b[0m%s', readableMessage) // Default color for other types
      }
      // Write to log file as JSON array
      return new Promise((resolve, reject) => {
        fs.writeFile(logFile, JSON.stringify(this.logs, null, 2), (err) => {
          if (err) {
            console.error('Failed to write to log file:', err)
            reject(err)
          }
          resolve()
        })

        fs.appendFile(readableLogFile, readableMessage, (err) => {
          if (err) {
            console.error('Failed to write to log file:', err)
            reject(err)
          }
          resolve()
        })
      })
    } catch (error) {
      console.error('Failed to log message:', error)
    }
  }

  async notifyListeners(data: Log): Promise<void> {
    this.listeners.forEach((listener) => listener(data))
  }

  addListener(callback: (data: Log) => void): void {
    this.listeners.push(callback)
  }

  public async getLogs(): Promise<Log[]> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(logFile)) {
        resolve([])
        return
      }

      fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
          return reject(err)
        }
        try {
          const logs = data ? JSON.parse(data) : []
          resolve(logs)
        } catch (error) {
          reject(error)
        }
      })
    })
  }
}

export const ResponseLogger = (replyFn: ReplyFn): ReplyFn => {
  return async (channel: string, reply: ReplyData): Promise<void> => {
    LoggingStore.getInstance().log(MESSAGE_TYPES.LOGGING, `[${channel}]: ${JSON.stringify(reply)}`)

    replyFn(channel, reply)
  }
}

export default LoggingStore.getInstance()

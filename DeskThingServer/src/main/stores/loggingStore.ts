import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { MESSAGE_TYPES, Log, LOGGING_LEVEL, Settings, ReplyData, ReplyFn } from '@shared/types'
import settingsStore from './settingsStore'

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
  private logLevel: LOGGING_LEVEL = LOGGING_LEVEL.PRODUCTION

  private constructor() {
    fs.writeFileSync(logFile, '[]')
    fs.writeFileSync(readableLogFile, '')

    settingsStore.addListener(this.settingsStoreListener.bind(this))
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

    console.log(readableMessage)

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

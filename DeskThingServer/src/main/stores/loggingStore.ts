/**
 * The `LoggingStore` class is a singleton that provides logging functionality for the application.
 * It writes log messages to a JSON file and a readable log file, and also logs messages to the console with colored output.
 * The log level can be configured through the `Settings` store.
 */
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

  /**
   * Updates the log level of the `LoggingStore` based on the settings from the `SettingsStore`.
   * @param settings - The updated settings from the `SettingsStore`.
   */
  private settingsStoreListener(settings: Settings): void {
    this.logLevel = settings.logLevel
  }

  // Singleton instance
  /**
   * Gets the singleton instance of the `LoggingStore` class.
   * If the instance doesn't exist, it creates a new instance and returns it.
   * @returns The singleton instance of the `LoggingStore` class.
   */
  public static getInstance(): LoggingStore {
    if (!LoggingStore.instance) {
      LoggingStore.instance = new LoggingStore()
    }
    return LoggingStore.instance
  }

  /**
   * Sets the log level of the `LoggingStore` instance.
   * @param level - The new log level to set.
   */
  public setLogLevel(level: LOGGING_LEVEL): void {
    this.logLevel = level
  }

  // Log a message
  /**
   * Logs a message with the specified level and source.
   * @param level - The message type (e.g. ERROR, WARNING, MESSAGE, LOGGING, FATAL, DEBUG).
   * @param message - The message to be logged.
   * @param source - The source of the message (default is 'server').
   * @returns A Promise that resolves when the message has been logged.
   */
  async log(level: MESSAGE_TYPES, message: string, source: string = 'server'): Promise<void> {
    try {
      if (
        level === MESSAGE_TYPES.LOGGING &&
        source === 'server' &&
        this.logLevel != LOGGING_LEVEL.SYSTEM
      ) {
        return
      }

      if (level === MESSAGE_TYPES.LOGGING && this.logLevel === LOGGING_LEVEL.PRODUCTION) {
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
      await this.notifyListeners(logData)

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

      await new Promise<void>((resolve, reject) => {
        fs.writeFile(logFile, JSON.stringify(this.logs, null, 2), (err) => {
          if (err) {
            console.error('Failed to write to log file:', err)
            reject(err)
            return
          }
          fs.appendFile(readableLogFile, readableMessage, (appendErr) => {
            if (appendErr) {
              console.error('Failed to write to readable log file:', appendErr)
              reject(appendErr)
              return
            }
            resolve()
          })
        })
      })
    } catch (error) {
      console.error('Failed to log message:', error)
      throw error
    }
  }

  /**
   * Notifies all registered listeners with the provided log data.
   *
   * @param data - The log data to pass to the registered listeners.
   * @returns A Promise that resolves when the notification process is complete.
   */
  async notifyListeners(data: Log): Promise<void> {
    await Promise.all(this.listeners.map((listener) => listener(data)))
  }

  /**
   * Adds a listener callback that will be notified when log data is available.
   *
   * @param callback - The callback function to be called with the log data.
   */
  addListener(callback: (data: Log) => void): void {
    this.listeners.push(callback)
  }

  /**
   * Retrieves the logs stored in the log file.
   *
   * @returns A Promise that resolves with an array of log entries, or an empty array if the log file does not exist.
   */
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

/**
 * A higher-order function that wraps a reply function with logging functionality.
 *
 * The `ResponseLogger` function takes a `replyFn` function as an argument and returns a new function that logs the reply data before calling the original `replyFn`.
 *
 * @param replyFn - The original reply function to be wrapped.
 * @returns A new function that logs the reply data before calling the original `replyFn`.
 */
export const ResponseLogger = (replyFn: ReplyFn): ReplyFn => {
  return async (channel: string, reply: ReplyData): Promise<void> => {
    await LoggingStore.getInstance().log(
      MESSAGE_TYPES.LOGGING,
      `[${channel}]: ${JSON.stringify(reply)}`
    )
    await replyFn(channel, reply)
  }
}

export default LoggingStore.getInstance()

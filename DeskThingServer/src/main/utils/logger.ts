/**
 * The `Logger` class is a singleton that provides logging functionality for the application.
 * It writes log messages to a JSON file and a readable log file, and also logs messages to the console with colored output.
 * The log level can be configured through the `Settings` store.
 */
console.log('[Logging Store] Starting')
import fs, { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { LOGGING_LEVELS } from '@DeskThing/types'
import { Log, LOG_FILTER, ReplyData, Settings, ReplyFn, LoggingOptions } from '@shared/types'
import { access, mkdir, readFile, rename, writeFile } from 'fs/promises'

// Logger configuration
const logFile = join(app.getPath('userData'), 'logs', 'application.log.json')
const readableLogFile = join(app.getPath('userData'), 'logs', 'readable.log')
// Ensure log directory exists
const logDir = join(app.getPath('userData'), 'logs')

class Logger {
  private static instance: Logger
  private listeners: ((data: Log) => void)[] = []
  private logs: Log[] = []
  private logLevel: LOG_FILTER = LOG_FILTER.SYSTEM
  private filesSetup = false
  private saveTimeout: NodeJS.Timeout | null = null

  private constructor() {
    this.setupFiles()
    import('@server/stores/settingsStore').then(({ default: settingsStore }) => {
      settingsStore.addListener(this.settingsStoreListener.bind(this))
    })
  }

  private setupFiles = async (): Promise<void> => {
    await mkdir(logDir, { recursive: true })

    const rotateFile = async (filePath: string): Promise<void> => {
      if (existsSync(filePath)) {
        const timestamp = new Date().toISOString().replace(/:/g, '-')
        await rename(filePath, `${filePath}.${timestamp}`)
      }
    }

    const initializeFile = async (filePath: string, initialContent: string): Promise<void> => {
      await writeFile(filePath, initialContent, {
        encoding: 'utf-8',
        mode: 0o644 // Readable by user, read-only for others
      })
    }

    try {
      await Promise.all([rotateFile(logFile), rotateFile(readableLogFile)])

      await Promise.all([initializeFile(logFile, '[]'), initializeFile(readableLogFile, '')])

      this.filesSetup = true
    } catch (error) {
      console.error('Failed to set up log files:', {
        error: error as Error,
        source: 'Logger',
        function: 'setupFiles'
      })
    }
  }

  /**
   * Updates the log level of the `Logger` based on the settings from the `SettingsStore`.
   * @param settings - The updated settings from the `SettingsStore`.
   */
  private settingsStoreListener(settings: Settings): void {
    this.logLevel = settings?.logLevel || LOG_FILTER.SYSTEM
  }

  // Singleton instance
  /**
   * Gets the singleton instance of the `Logger` class.
   * If the instance doesn't exist, it creates a new instance and returns it.
   * @returns The singleton instance of the `Logger` class.
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private saveLogs = async (): Promise<void> => {
    if (!this.filesSetup) return

    try {
      access(logFile)
      const fileLogs = await readFile(logFile, 'utf8')
      const logs = JSON.parse(fileLogs)

      const combinedLogs = [...this.logs, ...logs]

      await writeFile(logFile, JSON.stringify(combinedLogs, null, 2))
      this.logs = []
    } catch (error) {
      try {
        await writeFile(logFile, JSON.stringify(this.logs, null, 2))
        this.logs = []
      } catch (error) {
        console.error('Failed to save logs:', error)
      }
    }
  }

  private debouncedSaveLogs = async (): Promise<void> => {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(async () => {
      await this.saveLogs()
    }, 4000)
  }

  /**
   * Sets the log level of the `Logger` instance.
   * @param level - The new log level to set.
   */
  public setLogLevel(level: LOG_FILTER): void {
    this.logLevel = level
  }

  public info = async (message: string, options?: LoggingOptions): Promise<void> => {
    this.log(LOGGING_LEVELS.LOG, message, options)
  }

  public warn = async (message: string, options?: LoggingOptions): Promise<void> => {
    this.log(LOGGING_LEVELS.WARN, message, options)
  }

  public error = async (message: string, options?: LoggingOptions): Promise<void> => {
    this.log(LOGGING_LEVELS.ERROR, message, options)
  }

  public debug = async (message: string, options?: LoggingOptions): Promise<void> => {
    this.log(LOGGING_LEVELS.DEBUG, message, options)
  }

  public fatal = async (message: string, options?: LoggingOptions): Promise<void> => {
    this.log(LOGGING_LEVELS.FATAL, message, options)
  }

  /**
   * Logs a message with the specified level and source.
   * @param level - The message type (e.g. ERROR, WARNING, MESSAGE, LOGGING, FATAL, DEBUG).
   * @param message - The message to be logged.
   * @param source - The source of the message (default is 'server').
   * @returns A Promise that resolves when the message has been logged.
   */
  async log(level: LOGGING_LEVELS, message: string, options?: LoggingOptions): Promise<void> {
    if (!options || !options.domain) {
      options = {
        ...options,
        domain: 'server'
      }
    }
    try {
      if (
        level === LOGGING_LEVELS.LOG &&
        options.domain === 'server' &&
        this.logLevel != LOG_FILTER.SYSTEM
      ) {
        return
      }

      if (level === LOGGING_LEVELS.LOG && this.logLevel === LOG_FILTER.PRODUCTION) {
        return
      }

      if (options.error instanceof Error) {
        options.error = {
          name: options.error.name,
          message: options.error.message,
          stack: options.error.stack
        }
      } else {
        if (options.error) {
          options.error = new Error('Abnormal error detected: ', { cause: options.error })
        }
      }
      options.date = options.date || new Date().toISOString()

      const logData: Log = {
        options: options,
        type: level,
        log: message
      }

      this.logs.push(logData)
      await this.notifyListeners(logData)

      const readableTimestamp = new Date(options.date).toLocaleString()
      const readableMessage = `${options.domain || 'Unknown:'} ${readableTimestamp} ${level.toUpperCase()} [${options.source || 'server'}${options.function ? '.' + options.function : ''}]: ${message}\n${options.error ? options.error.message + '\n' : ''}`

      switch (level) {
        case LOGGING_LEVELS.ERROR:
          console.error('\x1b[31m%s\x1b[0m', readableMessage) // Red for error
          break
        case LOGGING_LEVELS.WARN:
          console.warn('\x1b[33m%s\x1b[0m', readableMessage) // Yellow for warning
          break
        case LOGGING_LEVELS.MESSAGE:
          console.log('\x1b[32m%s\x1b[0m', readableMessage) // Green for messages
          break
        case LOGGING_LEVELS.LOG:
          console.log('\x1b[90m%s\x1b[0m', readableMessage) // Dark gray for info
          break
        case LOGGING_LEVELS.FATAL:
          console.log('\x1b[35m%s\x1b[0m', readableMessage) // Magenta for fatal
          break
        case LOGGING_LEVELS.DEBUG:
          console.log('\x1b[34m%s\x1b[0m', readableMessage) // Blue for debug
          break
        default:
          console.log('\x1b[0m%s', readableMessage) // Default color for other types
      }

      this.debouncedSaveLogs()
      try {
        await fs.promises.appendFile(readableLogFile, readableMessage)
      } catch (appendErr) {
        console.error('Failed to write to readable log file:', appendErr)
        throw appendErr
      }
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
    await Logger.getInstance().log(LOGGING_LEVELS.LOG, `${JSON.stringify(reply)}`, {
      function: channel,
      source: 'ResponseLogger'
    })
    await replyFn(channel, reply)
  }
}

export default Logger.getInstance()

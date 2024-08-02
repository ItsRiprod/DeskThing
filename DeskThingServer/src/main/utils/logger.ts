import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'

// Define log levels
enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
  ERROR = 'error'
}

// Logger configuration
const logFile = join(app.getPath('userData'), 'application.log')

// Ensure log directory exists
const logDir = app.getPath('userData')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

class Logger {
  private static instance: Logger

  private constructor() {
    fs.writeFileSync(logFile, '')
  }

  // Singleton instance
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // Log a message
  private async log(level: LogLevel, message: string): Promise<void> {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}]: ${level.toUpperCase()} | ${message}`

    // Append to log file
    fs.appendFile(logFile, logMessage + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err)
      }
    })
  }

  // Info level logging
  public async info(message: string): Promise<void> {
    this.log(LogLevel.INFO, message)
  }

  // Debug level logging
  public async debug(message: string): Promise<void> {
    this.log(LogLevel.DEBUG, message)
  }

  // Error level logging
  public async error(message: string): Promise<void> {
    this.log(LogLevel.ERROR, message)
  }

  public async getLogs(): Promise<string[]> {
    console.log('LOGGER: Getting logs')
    return new Promise((resolve, reject) => {
      fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
          return reject(err)
        }
        const logs = data.trim().split('\n').filter(Boolean)
        resolve(logs)
      })
    })
  }
}

export default Logger.getInstance()

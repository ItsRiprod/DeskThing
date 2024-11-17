import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { MESSAGE_TYPES } from './events'

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
  async log(level: MESSAGE_TYPES, message: string): Promise<void> {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}]: ${level.toUpperCase()} | ${message}`

    // Append to log file
    fs.appendFile(logFile, logMessage + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err)
      }
    })
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

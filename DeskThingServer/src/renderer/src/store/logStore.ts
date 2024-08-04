import { EventEmitter } from '../utility/eventEmitter'

export interface Log {
  type: string
  log: string
  date: string
}

interface LogEvents {
  update: Log[]
  new: Log
}

class LogStore extends EventEmitter<LogEvents> {
  private static instance: LogStore
  private logList: Log[]
  private maxLogLength: number
  private maxNumLogs: number

  constructor(maxLogLength: number = 1000) {
    super()
    this.logList = []
    this.maxLogLength = maxLogLength
    this.maxNumLogs = 100
    window.electron.ipcRenderer.on('error', (_event, errorData) => this.addLog('error', errorData))
    window.electron.ipcRenderer.on('log', (_event, logData) => this.addLog('log', logData))
    window.electron.ipcRenderer.on('message', (_event, messageData) =>
      this.addLog('message', messageData)
    )
  }

  static getInstance(): LogStore {
    if (!LogStore.instance) {
      LogStore.instance = new LogStore()
    }
    return LogStore.instance
  }

  public async getLogs(): Promise<Log[]> {
    if (this.logList.length > 0) {
      return this.logList
    } else {
      const logs = await window.electron.getLogs()
      await this.addLogsFromFile(logs)
      return this.logList
    }
  }

  public addLog(type: string, log: string): void {
    const truncatedLog =
      log.length > this.maxLogLength ? `${log.substring(0, this.maxLogLength)}...` : log

    const newLog = {
      type: type,
      log: truncatedLog,
      date: new Date().toLocaleTimeString()
    }

    this.logList.push(newLog)

    if (this.logList.length > this.maxNumLogs) {
      this.logList.shift()
    }

    this.emit('update', this.logList)
    if (type === 'error' || type === 'message') {
      this.emit('new', newLog)
    }
  }

  public addLogsFromFile(logs: string[]): void {
    logs.forEach((log) => {
      const parsedLog = this.parseLog(log)
      if (parsedLog) {
        const truncatedLog =
          parsedLog.log.length > this.maxLogLength
            ? `${log.substring(0, this.maxLogLength)}...`
            : parsedLog.log

        const newLog = {
          type: parsedLog.type,
          log: truncatedLog,
          date: parsedLog.date
        }
        this.logList.push(newLog)
        if (this.logList.length > this.maxNumLogs) {
          this.logList.shift()
        }
      }
    })

    this.emit('update', this.logList)
  }

  private parseLog(log: string): Log | null {
    const logRegex = /^\[(.*?)\]: (\w+) \| (.*)$/
    const match = log.match(logRegex)
    if (match) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, timestamp, type, message] = match
      return {
        type: type,
        log: message,
        date: timestamp
      }
    } else {
      console.error('Failed to parse log:', log)
    }
    return null
  }
}

export default LogStore.getInstance()

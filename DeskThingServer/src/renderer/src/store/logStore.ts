import { EventEmitter } from '../utility/eventEmitter'

export interface log {
  type: string
  log: string
  date: Date
}

interface LogEvents {
  update: log[]
}

class LogStore extends EventEmitter<LogEvents> {
  private logList: log[]
  private maxLogLength: number

  constructor(maxLogLength: number = 1000) {
    super()
    this.logList = []
    this.maxLogLength = maxLogLength
  }

  public getLogs(): log[] {
    return this.logList
  }

  public addLog(type: string, log: string): void {
    const truncatedLog =
      log.length > this.maxLogLength ? `${log.substring(0, this.maxLogLength)}...` : log

    const newLog = {
      type: type,
      log: truncatedLog,
      date: new Date()
    }

    this.logList.push(newLog)

    this.emit('update', this.logList)
  }
}

const logInstance = new LogStore()

export default logInstance

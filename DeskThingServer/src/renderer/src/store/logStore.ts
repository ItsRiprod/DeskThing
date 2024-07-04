import { EventEmitter } from '../utility/eventEmitter'

export interface log {
  type: string
  log: string
  date: Date
}

class LogStore extends EventEmitter<log[]> {
  private logList: log[]

  constructor() {
    super()
    this.logList = []
  }

  public getLogs(): log[] {
    return this.logList
  }

  public addLog(type: string, log: string): void {
    const newLog = {
      type: type,
      log: log,
      date: new Date()
    }

    this.logList.push(newLog)

    this.emit('update', this.logList)
  }
}

const logInstance = new LogStore()

export default logInstance

import { create } from 'zustand'

export interface Log {
  type: string
  log: string
  date: string
}

interface LogStoreState {
  logList: Log[]
  maxLogLength: number
  maxNumLogs: number

  getLogs: () => Promise<Log[]>
  addLog: (type: string, log: string) => void
  addLogsFromFile: (logs: string[]) => void
}

const useLogStore = create<LogStoreState>((set, get) => ({
  logList: [],
  maxLogLength: 1000,
  maxNumLogs: 100,

  getLogs: async (): Promise<Log[]> => {
    const { logList } = get()
    if (logList.length > 0) {
      return logList
    } else {
      const logs = await window.electron.getLogs()
      get().addLogsFromFile(logs)
      return get().logList
    }
  },

  addLog: (type: string, log: string): void => {
    if (typeof log !== 'string') {
      console.error('Log is not a string')
      log = JSON.stringify(log)
    }
    const { maxLogLength, maxNumLogs } = get()
    const truncatedLog = log.length > maxLogLength ? `${log.substring(0, maxLogLength)}...` : log

    const newLog = {
      type: type,
      log: truncatedLog,
      date: new Date().toLocaleTimeString()
    }

    set((state) => ({
      logList: [...state.logList, newLog].slice(-maxNumLogs)
    }))

    // Emit events (you might want to implement a custom event system or use a library)
    // For now, we'll just log to console
    if (type === 'error' || type === 'message') {
      console.log('New log', newLog)
    }
  },

  addLogsFromFile: (logs: string[]): void => {
    const { maxLogLength, maxNumLogs } = get()
    const parsedLogs = logs
      .map((log) => {
        const parsedLog = parseLog(log)
        if (parsedLog) {
          const truncatedLog =
            parsedLog.log.length > maxLogLength
              ? `${parsedLog.log.substring(0, maxLogLength)}...`
              : parsedLog.log

          return {
            type: parsedLog.type,
            log: truncatedLog,
            date: parsedLog.date
          }
        }
        return null
      })
      .filter((log): log is Log => log !== null)

    set((state) => ({
      logList: [...state.logList, ...parsedLogs].slice(-maxNumLogs)
    }))

    // Emit update event (for now, just log to console)
    console.log('Logs updated', get().logList)
  }
}))

function parseLog(log: string): Log | null {
  const logRegex = /^\[(.*?)\]: (\w+) \| (.*)$/
  const match = log.match(logRegex)
  if (match) {
    const [, timestamp, type, message] = match
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

export default useLogStore

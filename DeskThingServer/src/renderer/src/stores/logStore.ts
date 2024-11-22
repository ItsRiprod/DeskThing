import { create } from 'zustand'
import { Log, MESSAGE_TYPES } from '@shared/types'

interface LogStoreState {
  logList: Log[]
  maxLogLength: number
  maxNumLogs: number

  getLogs: () => Promise<Log[]>
  addLog: (log: Log) => void
  addLogsFromFile: (logs: Log[]) => void
}

const useLogStore = create<LogStoreState>((set, get) => ({
  logList: [],
  maxLogLength: 1000,
  maxNumLogs: 300,

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

  addLog: async (log: Log): Promise<void> => {
    if (typeof log.log !== 'string') {
      try {
        if (log.log === null) {
          log.log = 'null'
        } else if (log.log === undefined) {
          log.log = 'undefined'
        } else if (typeof log.log === 'object') {
          log.log = JSON.stringify(log.log, null, 2)
        } else {
          log.log = String(log.log)
        }
      } catch (error) {
        console.error('Failed to convert log to string:', log, error)
        log.log = '[Unconvertible Value]'
      }
    }
    const { maxLogLength, maxNumLogs } = get()
    const truncatedLog =
      log.log.length > maxLogLength ? `${log.log.substring(0, maxLogLength)}...` : log.log

    const newLog = {
      ...log,
      log: truncatedLog
    }

    set((state) => ({
      logList: [...state.logList, newLog as Log].slice(-maxNumLogs)
    }))

    if (log.type != MESSAGE_TYPES.LOGGING) {
      console.log(newLog)
    }
  },
  addLogsFromFile: async (logs: Log[]): Promise<void> => {
    const { maxNumLogs } = get()
    console.log('adding logs from file', logs)
    set((state) => ({
      logList: [...state.logList, ...logs].slice(-maxNumLogs)
    }))

    // Emit update event (for now, just log to console)
    console.log('Logs updated', get().logList)
  }
}))

export default useLogStore

import { create } from 'zustand'
import { Log } from '@shared/types'
import { IpcRendererCallback } from '@shared/types'

interface LogStoreState {
  logList: Log[]
  maxLogLength: number
  maxNumLogs: number
  initialized: boolean

  initialize: () => Promise<void>
  addLog: (log: Log) => void
  addLogsFromFile: (logs: Log[]) => void
}

const useLogStore = create<LogStoreState>((set, get) => ({
  logList: [],
  maxLogLength: 1000,
  maxNumLogs: 500,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleLog: IpcRendererCallback<'log'> = (_event, log) => {
      get().addLog(log)
    }

    window.electron.ipcRenderer.on('log', handleLog)

    const logs = await window.electron.utility.getLogs()
    get().addLogsFromFile(logs)

    set({ initialized: true })
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
  },
  addLogsFromFile: async (logs: Log[]): Promise<void> => {
    const { maxNumLogs } = get()
    set((state) => ({
      logList: [...state.logList, ...logs].slice(-maxNumLogs)
    }))
  }
}))

export default useLogStore

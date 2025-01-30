import { useEffect } from 'react'
import { useLogStore, useNotificationStore } from '../stores/index.ts'
import { Log } from '@shared/types/index.ts'
import type { IpcRendererEvent } from 'electron';

const LogDataListener = (): null => {
  const addLog = useLogStore((state) => state.addLog)
  const addLogs = useNotificationStore((state) => state.addLog)

  useEffect(() => {
    const handleLog = async (_event: IpcRendererEvent, log: Log): Promise<void> => {
      addLog(log)
      addLogs(log)
    }

    // Listen for IPC events
    window.electron.ipcRenderer.on('log', handleLog)

    // Clean up the IPC listeners when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeAllListeners('log')
    }
  }, [addLog])

  return null
}

export default LogDataListener

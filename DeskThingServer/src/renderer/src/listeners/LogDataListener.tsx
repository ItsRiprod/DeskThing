import { useEffect } from 'react'
import { useLogStore, useNotificationStore } from '../stores'
import { Log } from '@shared/types'

/**
 * A React component that listens for 'log' events from the Electron IPC and updates the log and notification stores accordingly.
 *
 * This component should be used in the main application to ensure that log data is properly captured and displayed to the user.
 */
const LogDataListener = (): null => {
  const addLog = useLogStore((state) => state.addLog)
  const addLogs = useNotificationStore((state) => state.addLog)

  useEffect(() => {
    const handleLog = async (_event, log: Log): Promise<void> => {
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

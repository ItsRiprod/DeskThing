import { useEffect } from 'react'
import { useLogStore, useNotificationStore } from '../stores'

const LogDataListener = (): null => {
  const addLog = useLogStore((state) => state.addLog)
  const addLogs = useNotificationStore((state) => state.addLog)

  useEffect(() => {
    const handleError = (_event, errorData): void => {
      if (typeof errorData != 'string') {
        console.log(errorData)
        errorData = JSON.stringify(errorData)
      }
      addLog('error', errorData)
      addLogs('error', errorData)
    }

    const handleLog = (_event, logData): void => {
      if (typeof logData != 'string') {
        console.log(logData)
        logData = JSON.stringify(logData)
      }
      addLog('log', logData)
    }

    const handleMessage = (_event, messageData): void => {
      if (typeof messageData != 'string') {
        console.log(messageData)
        messageData = JSON.stringify(messageData)
      }
      addLog('message', messageData)
      addLogs('log', messageData)
    }

    // Listen for IPC events
    window.electron.ipcRenderer.on('error', handleError)
    window.electron.ipcRenderer.on('log', handleLog)
    window.electron.ipcRenderer.on('message', handleMessage)

    // Clean up the IPC listeners when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeAllListeners('error')
      window.electron.ipcRenderer.removeAllListeners('log')
      window.electron.ipcRenderer.removeAllListeners('message')
    }
  }, [addLog])

  return null
}

export default LogDataListener

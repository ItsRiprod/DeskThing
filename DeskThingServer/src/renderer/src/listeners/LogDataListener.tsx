import { useEffect } from 'react'
import { useLogStore } from '../stores'

const LogDataListener = (): null => {
  const addLog = useLogStore((state) => state.addLog)

  useEffect(() => {
    const handleError = (_event, errorData): void => {
      addLog('error', errorData)
    }

    const handleLog = (_event, logData): void => {
      addLog('log', logData)
    }

    const handleMessage = (_event, messageData): void => {
      addLog('message', messageData)
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

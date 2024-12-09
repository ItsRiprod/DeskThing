import { useEffect } from 'react'
import { useClientStore, useNotificationStore } from '../stores'

const ClientDataListener = (): null => {
  const setClients = useClientStore((state) => state.setClients)
  const setConnections = useClientStore((state) => state.setConnections)
  const setAdbDevices = useClientStore((state) => state.setADBDevices)
  const requestADBDevices = useClientStore((state) => state.requestADBDevices)
  const requestConnections = useClientStore((state) => state.requestConnections)
  const requestClientManifest = useClientStore((state) => state.requestClientManifest)

  const addTask = useNotificationStore((state) => state.addTask)

  useEffect(() => {
    window.electron.ipcRenderer.on('clients', async (_event, data) => {
      setClients(data.data)
    })

    window.electron.ipcRenderer.on('connections', async (_event, data) => {
      setConnections(data.data)
    })

    window.electron.ipcRenderer.on('adbdevices', async (_event, data) => {
      setAdbDevices(data.data)
    })

    const getInitialState = async (): Promise<void> => {
      requestConnections()
      requestADBDevices()
      requestClientManifest()

      addTask({
        id: 'adbdevices-setup',
        title: 'Find ADB Devices',
        description: 'You look new around here. Lets try and get your device connected!',
        status: 'pending',
        complete: false,
        steps: [
          {
            task: 'Ensure the device is plugged in',
            status: false,
            stepId: 'plugged-in'
          },
          { task: 'Try refreshing ADB', status: false, stepId: 'refresh' }
        ]
      })
    }

    getInitialState()

    // Cleanup listeners on unmount
    return () => {
      window.electron.ipcRenderer.removeAllListeners('clients')
      window.electron.ipcRenderer.removeAllListeners('connections')
      window.electron.ipcRenderer.removeAllListeners('adbdevices')
    }
  }, [setClients, setConnections, setAdbDevices])

  return null
}

export default ClientDataListener

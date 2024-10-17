import { useEffect } from 'react'
import { useClientStore } from '../stores'

const ClientDataListener = (): null => {
  const setClients = useClientStore((state) => state.setClients)
  const setConnections = useClientStore((state) => state.setConnections)
  const setAdbDevices = useClientStore((state) => state.setADBDevices)
  const requestADBDevices = useClientStore((state) => state.requestADBDevices)
  const requestConnections = useClientStore((state) => state.requestConnections)
  const requestClientManifest = useClientStore((state) => state.requestClientManifest)

  useEffect(() => {
    window.electron.ipcRenderer.on('clients', (_event, data) => {
      console.log('Received clients data:', data)
      setClients(data.data)
    })

    window.electron.ipcRenderer.on('connections', (_event, data) => {
      setConnections(data.data)
    })

    window.electron.ipcRenderer.on('adbdevices', (_event, data) => {
      setAdbDevices(data.data)
    })

    const getInitialState = async (): Promise<void> => {
      requestConnections()
      requestADBDevices()
      requestClientManifest()
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

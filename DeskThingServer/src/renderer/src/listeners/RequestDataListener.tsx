import { useEffect } from 'react'
import { useClientStore, useNotificationStore } from '@renderer/stores'
import { AuthScopes } from '@shared/types'

const RequestDataListener = (): null => {
  const addRequest = useNotificationStore((state) => state.addRequest)
  const resolveTask = useNotificationStore((state) => state.resolveTask)
  const addTask = useNotificationStore((state) => state.addTask)
  const devices = useClientStore((state) => state.ADBDevices)
  const clientManifest = useClientStore((state) => state.clientManifest)

  useEffect(() => {
    const checkDevices = async (): Promise<void> => {
      resolveTask('adbdevices-setup')
      addTask({
        id: 'adbdevices-configure',
        title: 'Configure ADB Device',
        description:
          'Looks like you have some devices connected! Try configuring one of them to run DeskThing!',
        status: 'pending',
        complete: false,
        steps: [
          {
            task: 'Ensure you have a client installed',
            status: clientManifest !== null,
            stepId: 'install'
          },
          {
            task: 'Hit the Configure Device button to load the client',
            status: false,
            stepId: 'configure'
          },
          { task: 'Ping the device to make sure its working!', status: false, stepId: 'ping' }
        ]
      })
    }

    if (devices.length > 0) {
      checkDevices()
    }
  }, [devices])

  useEffect(() => {
    const handleDisplayUserForm = async (
      _event,
      requestId: string,
      fields: AuthScopes
    ): Promise<void> => {
      addRequest(requestId, fields)
    }

    window.electron.ipcRenderer.on('display-user-form', handleDisplayUserForm)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('display-user-form')
    }
  }, [addRequest])

  return null
}

export default RequestDataListener

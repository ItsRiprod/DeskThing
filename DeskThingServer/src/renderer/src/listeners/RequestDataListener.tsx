import { useEffect } from 'react'
import { useRequestStore } from '../stores'
import { AuthScopes } from '@shared/types'

const RequestDataListener = (): null => {
  const addRequest = useRequestStore((state) => state.addRequest)

  useEffect(() => {
    const handleDisplayUserForm = (_event, requestId: string, fields: AuthScopes): void => {
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

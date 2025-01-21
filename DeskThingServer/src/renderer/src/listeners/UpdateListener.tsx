import { useEffect } from 'react'
import { UpdateInfoType } from '@shared/types'
import useUpdateStore from '@renderer/stores/updateStore'

const UpdateDataListener = (): null => {
  const updateStatus = useUpdateStore((state) => state.updateStatus)

  useEffect(() => {
    const handleUpdateStatus = async (_event, update: UpdateInfoType): Promise<void> => {
      await updateStatus(update)
    }

    window.electron.ipcRenderer.on('update-status', handleUpdateStatus)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-status')
    }
  }, [])

  return null
}

export default UpdateDataListener

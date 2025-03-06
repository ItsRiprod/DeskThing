import { useEffect } from 'react'
import { useNotificationStore } from '@renderer/stores'
import useTaskStore from '@renderer/stores/taskStore'
import { IpcRendererCallback } from '@shared/types'

const RequestDataListener = (): null => {
  const addRequest = useNotificationStore((state) => state.addRequest)
  const setAppTasks = useTaskStore((state) => state.setAppTaskList)
  const getTaskList = useTaskStore((state) => state.requestTasks)

  getTaskList()

  useEffect(() => {
    const handleDisplayUserForm: IpcRendererCallback<'display-user-form'> = async (
      _event,
      { requestId, scope }
    ): Promise<void> => {
      addRequest(requestId, scope)
    }
    const handleTask: IpcRendererCallback<'taskList'> = async (_event, tasks): Promise<void> => {
      setAppTasks(tasks.source, tasks.taskList)
    }

    window.electron.ipcRenderer.on('display-user-form', handleDisplayUserForm)
    window.electron.ipcRenderer.on('taskList', handleTask)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('display-user-form')
      window.electron.ipcRenderer.removeAllListeners('taskList')
    }
  }, [])

  return null
}

export default RequestDataListener

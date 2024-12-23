import { useEffect } from 'react'
import { useNotificationStore } from '@renderer/stores'
import { AuthScopes } from '@shared/types'
import useTaskStore from '@renderer/stores/taskStore'
import { TaskList } from '@shared/types/tasks'

const RequestDataListener = (): null => {
  const addRequest = useNotificationStore((state) => state.addRequest)
  const setTasks = useTaskStore((state) => state.setTaskList)
  const getTaskList = useTaskStore((state) => state.requestTasks)

  useEffect(() => {
    const handleDisplayUserForm = async (
      _event,
      requestId: string,
      fields: AuthScopes
    ): Promise<void> => {
      addRequest(requestId, fields)
    }
    const handleTask = async (_event, tasks: TaskList): Promise<void> => {
      setTasks(tasks)
    }

    getTaskList()

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

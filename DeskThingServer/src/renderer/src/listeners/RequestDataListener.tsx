import { useEffect } from 'react'
import { useNotificationStore } from '@renderer/stores'
import useTaskStore from '@renderer/stores/taskStore'
import { IpcRendererCallback } from '@shared/types'

const RequestDataListener = (): null => {
  const addRequest = useNotificationStore((state) => state.addRequest)
  const setAppTasks = useTaskStore((state) => state.setAppTaskList)
  const setTask = useTaskStore((state) => state.setTask)
  const setCurrentTask = useTaskStore((state) => state.setCurrentTask)
  const getTaskList = useTaskStore((state) => state.requestTasks)

  getTaskList()

  useEffect(() => {
    const handleDisplayUserForm: IpcRendererCallback<'display-user-form'> = async (
      _event,
      { requestId, scope }
    ): Promise<void> => {
      addRequest(requestId, scope)
    }

    const handleTasks: IpcRendererCallback<'taskList'> = async (_event, tasks): Promise<void> => {
      setAppTasks(tasks.source, tasks.taskList)
    }

    const handleTask: IpcRendererCallback<'task'> = async (_event, task): Promise<void> => {
      console.log('Handling task update', task)
      setTask(task)
    }

    const handleCurrentTask: IpcRendererCallback<'currentTask'> = async (
      _event,
      task
    ): Promise<void> => {
      setCurrentTask(task)
    }

    window.electron.ipcRenderer.on('display-user-form', handleDisplayUserForm)
    window.electron.ipcRenderer.on('taskList', handleTasks)
    window.electron.ipcRenderer.on('task', handleTask)
    window.electron.ipcRenderer.on('currentTask', handleCurrentTask)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('display-user-form')
      window.electron.ipcRenderer.removeAllListeners('task')
      window.electron.ipcRenderer.removeAllListeners('taskList')
      window.electron.ipcRenderer.removeAllListeners('currentTask')
    }
  }, [])

  return null
}

export default RequestDataListener

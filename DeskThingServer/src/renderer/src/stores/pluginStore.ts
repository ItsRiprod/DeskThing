import { PluginApplications, PluginManifest } from '@deskthing/types'
import { PluginPayload } from '@shared/types'
import { create } from 'zustand'

interface PluginStoreState {
  initialized: boolean

  initialize: () => Promise<void>

  getPluginByApp: (application: PluginApplications) => Promise<PluginManifest[]>

  installPlugin: (
    pluginId: string,
    pluginType: PluginApplications,
    data: PluginPayload<PluginApplications>
  ) => Promise<void>

  uninstallPlugin: (
    pluginId: string,
    pluginType: PluginApplications,
    data: PluginPayload<PluginApplications>
  ) => Promise<void>
}

// Create Zustand store
const usePluginStore = create<PluginStoreState>((_, get) => ({
  taskList: {},
  currentTask: undefined,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    // const handleTasks: IpcRendererCallback<'taskList'> = (_event, tasks) => {
    //   set((state) => ({
    //     ...state,
    //     taskList: {
    //       ...state.taskList,
    //       [tasks.source]: tasks.taskList
    //     }
    //   }))
    // }

    // const handleTask: IpcRendererCallback<'plugin'> = (_event, task) => {
    //   set((state) => ({
    //     ...state,
    //     taskList: {
    //       ...state.taskList,
    //       [task.source]: {
    //         ...state.taskList[task.source],
    //         [task.id]: task
    //       }
    //     }
    //   }))
    // }

    // const handleCurrentTask: IpcRendererCallback<'currentTask'> = (_event, task) => {
    //   set((state) => ({
    //     ...state,
    //     currentTask: task
    //   }))
    // }

    // window.electron.ipcRenderer.on('taskList', handleTasks)
    // window.electron.ipcRenderer.on('task', handleTask)
    // window.electron.ipcRenderer.on('currentTask', handleCurrentTask)

    // const taskList = await window.electron.task.getTaskList()
    // set({
    //   taskList,
    //   initialized: true
    // })
  },

  getPluginByApp: (application: PluginApplications) => {
    return window.electron.plugins.getPluginsByApplication(application)
  },

  installPlugin: async (
    pluginId: string,
    pluginType: PluginApplications,
    data: PluginPayload<PluginApplications>
  ): Promise<void> => {
    return window.electron.plugins.installPlugin(pluginId, pluginType, data)
  },

  uninstallPlugin: async (
    pluginId: string,
    pluginType: PluginApplications,
    data: PluginPayload<PluginApplications>
  ): Promise<void> => {
    return window.electron.plugins.uninstallPlugin(pluginId, pluginType, data)
  }
}))

export default usePluginStore

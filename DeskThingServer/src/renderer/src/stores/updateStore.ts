import { create } from 'zustand'
import { UpdateInfoType } from '@shared/types'
import { IpcRendererCallback } from '@shared/types'

interface UpdateStoreState {
  update: UpdateInfoType
  initialized: boolean
  initialize: () => Promise<void>
  checkForUpdates: () => Promise<string>
  quitAndInstall: () => Promise<void>
  downloadUpdate: () => Promise<void>
  updateStatus: (updateInfo: UpdateInfoType) => Promise<void>
}

const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  update: {
    updateAvailable: false,
    updateDownloaded: false
  },
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleUpdateStatus: IpcRendererCallback<'update-status'> = async (_event, update) => {
      await get().updateStatus(update)
    }

    window.electron.ipcRenderer.on('update-status', handleUpdateStatus)

    set({ initialized: true })
  },

  updateStatus: async (updateInfo: UpdateInfoType): Promise<void> => {
    set({ update: updateInfo })
  },

  checkForUpdates: async (): Promise<string> => {
    return await window.electron.update.check()
  },

  quitAndInstall: async (): Promise<void> => {
    window.electron.update.install()
  },

  downloadUpdate: async (): Promise<void> => {
    window.electron.update.download()
  }
}))

export default useUpdateStore

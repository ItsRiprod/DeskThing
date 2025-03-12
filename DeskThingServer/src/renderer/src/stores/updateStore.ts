import { create } from 'zustand'
import { UpdateInfoType } from '@shared/types'

interface UpdateStoreState {
  update: UpdateInfoType
  checkForUpdates: () => Promise<void>
  quitAndInstall: () => Promise<void>
  downloadUpdate: () => Promise<void>
  updateStatus: (updateInfo: UpdateInfoType) => Promise<void>
}

const useUpdateStore = create<UpdateStoreState>((set) => ({
  update: {
    updateAvailable: false,
    updateDownloaded: false
  },

  updateStatus: async (updateInfo: UpdateInfoType): Promise<void> => {
    set({ update: updateInfo })
  },

  checkForUpdates: async (): Promise<void> => {
    window.electron.update.check()
  },

  quitAndInstall: async (): Promise<void> => {
    window.electron.update.install()
  },

  downloadUpdate: async (): Promise<void> => {
    window.electron.update.download()
  }
}))

export default useUpdateStore

import { create } from 'zustand'
import {
  AutoConfigResult,
  FlashingState,
  IpcRendererCallback,
  ThingifyApiFirmware,
  ThingifyApiVersion,
  ThingifyArchiveDownloadEvent,
  ThingifyArchiveDownloadResult
} from '@shared/types'

interface FlashStoreState {
  initialized: boolean
  flashEvent: FlashingState | null
  downloadProgress: ThingifyArchiveDownloadEvent | null
  stagedFileName: string | null

  // Flash Operations
  getFlashSteps: () => Promise<number | null>
  getFlashState: () => Promise<FlashingState | null>
  getDeviceSelection: () => Promise<string[] | null>
  setDeviceSelection: (device: string) => Promise<string>
  startFlash: () => Promise<void>
  cancelFlash: () => Promise<void>
  restartFlash: () => Promise<void>
  unbrickDevice: () => Promise<void>
  configureUSBMode: () => Promise<void>
  runAutoConfig: (step: number) => Promise<AutoConfigResult>

  // Driver Operations
  runDriver: () => Promise<void>

  // Thingify Operations
  getFirmware: () => Promise<ThingifyApiFirmware | null>
  getVersions: (firmwareId: string) => Promise<ThingifyApiVersion | null>
  getStagedFile: () => Promise<string | undefined>
  downloadFirmware: (version: string, file: string) => Promise<ThingifyArchiveDownloadResult | null>
  uploadFirmware: (filePath: string) => Promise<ThingifyArchiveDownloadResult>
  clearDownload: () => void

  getAvailableStagedFiles(): Promise<string[]>

  selectStagedFile(fileName: string): Promise<string>

  // Actions
  initialize: () => Promise<void>
}

const useFlashStore = create<FlashStoreState>((set, get) => ({
  initialized: false,
  flashEvent: null,
  downloadProgress: null,
  stagedFileName: null,

  // Flash Methods
  getFlashSteps: async () => {
    return window.electron.device.getSteps()
  },

  getFlashState: async () => {
    if (get().flashEvent) return get().flashEvent
    return window.electron.device.getCurrentState()
  },

  getDeviceSelection: async () => {
    return window.electron.device.getAvailableDevices()
  },

  setDeviceSelection: async (device: string) => {
    return window.electron.device.setDeviceSelection(device)
  },

  startFlash: async () => {
    return window.electron.device.startFlash()
  },

  configureUSBMode: async () => {
    return window.electron.device.startUSBMode()
  },

  cancelFlash: async () => {
    return window.electron.device.cancelFlash()
  },

  restartFlash: async () => {
    return window.electron.device.restartFlash()
  },

  unbrickDevice: async () => {
    return window.electron.device.runUnbrick()
  },

  runAutoConfig: async (step: number) => {
    return window.electron.device.runAutoConfig(step)
  },

  // Driver Methods
  runDriver: async () => {
    return window.electron.device.runDriver()
  },

  // Thingify Methods
  getFirmware: async () => {
    return window.electron.device.getFirmwareOptions()
  },

  getVersions: async (firmwareId: string) => {
    return window.electron.device.getFiles(firmwareId)
  },

  getStagedFile: async () => {
    const fileName = await window.electron.device.getStagedFile()
    set({ stagedFileName: fileName || null })
    return fileName
  },

  downloadFirmware: async (version: string, file: string) => {
    return window.electron.device.downloadFile(version, file)
  },

  uploadFirmware: async (filePath: string) => {
    return window.electron.device.uploadFile(filePath)
  },

  clearDownload: async () => {
    set({ downloadProgress: null })
  },

  getAvailableStagedFiles: async () => {
    return window.electron.device.getAvailableStagedFiles()
  },

  selectStagedFile: async (fileName: string) => {
    return window.electron.device.selectStagedFile(fileName)
  },

  // Initialize
  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })

    const handleFlashEvent: IpcRendererCallback<'flash:state'> = async (
      _event,
      payload
    ): Promise<void> => {
      set({ flashEvent: payload })
    }

    const handleDownloadProgress: IpcRendererCallback<'flash:download'> = async (
      _event,
      payload
    ): Promise<void> => {
      console.log('Flash Progress: ', payload)
      set({ downloadProgress: payload })
    }

    const handleStagedFileChange: IpcRendererCallback<'flash:stagedFile'> = async (
      _event,
      payload
    ): Promise<void> => {
      set({ stagedFileName: payload })
    }

    window.electron.ipcRenderer.on('flash:state', handleFlashEvent)
    window.electron.ipcRenderer.on('flash:download', handleDownloadProgress)
    window.electron.ipcRenderer.on('flash:stagedFile', handleStagedFileChange)
  }
}))

export default useFlashStore

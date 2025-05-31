import { create } from 'zustand'
import { Client, ClientManifest } from '@deskthing/types'
import { SCRIPT_IDs } from '@shared/types'

interface PlatformStoreState {
  initialized: boolean

  // ADB
  getManifest: (adbId: string) => Promise<ClientManifest | undefined>
  setManifest: (adbId: string, manifest: Partial<ClientManifest>) => Promise<void>
  pushStaged: (adbId: string) => Promise<boolean>
  pushScript: (adbId: string, scriptId: SCRIPT_IDs, force?: boolean) => Promise<string | undefined>
  runCommand: (adbId: string, command: string) => Promise<string | undefined>
  refreshADB: () => Promise<Client[] | undefined>
  setBrightness: (adbId: string, brightness: number) => Promise<boolean>
  configure: (adbId: string) => Promise<boolean>
  setServiceStatus: (adbId: string, service: string, status: boolean) => Promise<boolean>

  // WebSocket
  ping: (clientId: string) => Promise<void>
  pong: (clientId: string) => Promise<string | undefined>
  disconnect: (clientId: string) => Promise<boolean>
  restart: (request?: string) => Promise<void>

  // Bluetooth
  doSomething: () => Promise<void>

  // Actions
  initialize: () => Promise<void>
  resendInitialData: (clientId: string) => Promise<void>
}

const usePlatformStore = create<PlatformStoreState>((set, get) => ({
  initialized: false,

  // ADB Methods
  getManifest: async (adbId: string) => {
    return window.electron.platform.adb.getManifest(adbId)
  },

  setBrightness: async (adbId: string, brightness: number) => {
    return window.electron.platform.adb.setBrightness(adbId, brightness)
  },

  setManifest: async (adbId: string, manifest: Partial<ClientManifest>) => {
    return window.electron.platform.adb.setManifest(adbId, manifest)
  },

  pushStaged: async (adbId: string) => {
    return window.electron.platform.adb.pushStaged(adbId)
  },

  configure: async (adbId: string) => {
    return window.electron.platform.adb.configure(adbId)
  },

  pushScript: async (adbId: string, scriptId: SCRIPT_IDs, force = false) => {
    return window.electron.platform.adb.pushScript(adbId, scriptId, force)
  },

  runCommand: async (adbId: string, command: string) => {
    return window.electron.platform.adb.runCommand(adbId, command)
  },

  refreshADB: async () => {
    return window.electron.platform.adb.refresh()
  },

  // WebSocket Methods
  ping: async (clientId: string) => {
    return window.electron.platform.websocket.ping(clientId)
  },

  pong: async (clientId: string) => {
    return window.electron.platform.websocket.pong(clientId)
  },

  disconnect: async (clientId: string) => {
    return window.electron.platform.websocket.disconnect(clientId)
  },

  restart: async (request?: string) => {
    return window.electron.platform.websocket.restart(request)
  },

  setServiceStatus: async (adbId: string, service: string, status: boolean) => {
    return (await window.electron.platform.adb.setSupervisorStatus(adbId, service, status)) || false
  },

  // Bluetooth Methods
  doSomething: async () => {
    return window.electron.platform.bluetooth.doSomething()
  },

  // Initialize
  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })
  },

  resendInitialData: async (clientId: string): Promise<void> => {
    return await window.electron.platform.resendInitialData(clientId)
  }
}))

export default usePlatformStore

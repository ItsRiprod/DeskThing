import { create } from 'zustand'
import { LinkRequest, LOG_FILTER, Settings } from '@shared/types'

interface SettingsStoreState {
  settings: Settings
  activeRequests: LinkRequest[]
  getSettings: () => Promise<Settings>
  requestSettings: () => Promise<Settings>
  getSetting: (key: keyof Settings) => Settings[keyof Settings]
  saveSettings: (settings: Settings) => void
  savePartialSettings: (settings: Partial<Settings>) => void
  setSettings: (settings: Settings) => void
  addRequest: (request: LinkRequest) => void
  resolveRequest: (request: LinkRequest, ignore?: boolean) => void
  clearRequests: () => void
}

const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  activeRequests: [],
  settings: {
    version: '0.0.0',
    version_code: 0,
    callbackPort: -1,
    devicePort: -1,
    address: '-.-.-.-',
    autoStart: true,
    LogLevel: LOG_FILTER.INFO,
    minimizeApp: true,
    autoConfig: false,
    globalADB: false,
    autoDetectADB: false,
    refreshInterval: -1,
    playbackLocation: undefined,
    localIp: ['-.-.-.-'],
    appRepos: ['https://github.com/ItsRiprod/deskthing-apps'],
    clientRepos: ['https://github.com/ItsRiprod/deskthing-client']
  },

  addRequest: (request: LinkRequest): void => {
    set((state) => ({
      ...state,
      activeRequests: [
        ...state.activeRequests.filter((r) => !(r.app === request.app && r.url === request.url)),
        request
      ]
    }))
  },

  resolveRequest: (request: LinkRequest, ignore = false): void => {
    if (!ignore) {
      window.open(request.url, '_blank')
    }
    set((state) => ({
      ...state,
      activeRequests: state.activeRequests.filter((r) => r !== request)
    }))
  },

  clearRequests: (): void => {
    set({ activeRequests: [] })
  },

  getSettings: async (): Promise<Settings> => {
    const state = get()
    if (state.settings.callbackPort === -1 || state.settings.devicePort === -1) {
      await get().requestSettings()
    }
    return state.settings
  },

  requestSettings: async (): Promise<Settings> => {
    const settings = await window.electron.getSettings()
    set(settings)
    return settings
  },

  getSetting: (key: keyof Settings): Settings[keyof Settings] => {
    return get().settings[key]
  },

  saveSettings: async (settings: Settings): Promise<void> => {
    set({ settings })
    window.electron.saveSettings(settings)
  },

  savePartialSettings: async (settings: Partial<Settings>): Promise<void> => {
    const currentSettings = get().settings
    const updatedSettings = { ...currentSettings, ...settings }
    set({ settings: updatedSettings })
    window.electron.saveSettings(updatedSettings)
  },

  setSettings: async (settings: Settings): Promise<void> => {
    set({ settings })
  }
}))

export default useSettingsStore

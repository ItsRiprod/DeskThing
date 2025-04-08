import { ClientConfigurations, ScreensaverSettings, ViewMode, VolMode } from '@deskthing/types'

const defaultScreenSaverSettings: ScreensaverSettings = {
  version: '0.11.0',
  type: 'clock'
}

export const defaultConfig: ClientConfigurations = {
  profileId: 'default-config',
  version: '0.11.0',
  appTrayState: ViewMode.HIDDEN,
  volume: VolMode.WHEEL,
  ShowNotifications: false,
  Screensaver: {
    name: 'dashboard',
    enabled: false,
    running: false,
    timeStarted: 0,
    prefIndex: 0,
    meta: undefined,
    manifest: {
      id: '',
      label: '',
      requires: [],
      version: '',
      description: '',
      author: '',
      platforms: [],
      homepage: '',
      repository: '',
      updateUrl: '',
      tags: [],
      requiredVersions: {
        server: '',
        client: ''
      },
      template: '',
      version_code: 0,
      compatible_server: [],
      compatible_client: [],
      isAudioSource: false,
      isScreenSaver: false,
      isLocalApp: false,
      isWebApp: false
    }
  },
  currentView: {
    name: 'dashboard',
    enabled: true,
    running: true,
    timeStarted: 0,
    prefIndex: 0
  },
  ScreensaverType: defaultScreenSaverSettings,
  onboarding: true,
  showPullTabs: true,
  saveLocation: true,
  use24hour: false
}

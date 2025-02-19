import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import os from 'os'
import { writeToFile, readFromFile } from '@server/services/files/fileService'
import { LOG_FILTER, Settings } from '@shared/types'

vi.mock('fs')
vi.mock('os')
vi.mock('auto-launch', () => ({
  default: vi.fn().mockImplementation(() => ({
    enable: vi.fn(),
    disable: vi.fn()
  }))
}))

vi.mock('@server/utils/FileService')
vi.mock('@server/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
  }
}))

import settingsStore from '@server/stores/settingsStore'

describe('settingsStore', () => {
  const mockSettings: Settings = {
    version: '0.9.2',
    version_code: 9.2,
    callbackPort: 8888,
    devicePort: 8891,
    address: '0.0.0.0',
    LogLevel: LOG_FILTER.PRODUCTION,
    autoStart: false,
    autoConfig: false,
    minimizeApp: true,
    globalADB: false,
    autoDetectADB: false,
    refreshInterval: -1,
    playbackLocation: 'none',
    localIp: ['192.168.1.100'],
    appRepos: ['https://github.com/ItsRiprod/deskthing-apps'],
    clientRepos: ['https://github.com/ItsRiprod/deskthing-client']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readFromFile).mockResolvedValue(mockSettings)
    vi.mocked(writeToFile).mockResolvedValue(undefined)
    vi.mocked(os.networkInterfaces).mockReturnValue({
      eth0: [
        {
          address: '192.168.1.100',
          netmask: '255.255.255.0',
          family: 'IPv4',
          internal: false,
          mac: '00:00:00:00:00:00',
          cidr: '192.168.1.100/24'
        }
      ]
    } as NodeJS.Dict<os.NetworkInterfaceInfo[]>)
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should initialize with default settings', async () => {
    vi.mocked(readFromFile).mockRejectedValue(new Error('File not found'))
    const settings = await settingsStore.getSettings()
    expect(settings)
  })

  it('should return localhost when no valid network interfaces are found', async () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({} as NodeJS.Dict<os.NetworkInterfaceInfo[]>)
    const settings = await settingsStore.getSettings()
    expect(settings.localIp).toEqual(['127.0.0.1'])
  })

  it('should notify all listeners when settings are updated', async () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    settingsStore.addListener(listener1)
    settingsStore.addListener(listener2)

    await settingsStore.updateSetting('minimizeApp', false)
    await new Promise(process.nextTick)

    expect(listener1).toHaveBeenCalledWith(expect.objectContaining({ minimizeApp: false }))
    expect(listener2).toHaveBeenCalledWith(expect.objectContaining({ minimizeApp: false }))
  })

  it('should handle auto-launch setting updates', async () => {
    await settingsStore.updateSetting('autoStart', true)
    const settings = await settingsStore.getSettings()
    expect(settings.autoStart).toBe(true)
    expect(writeToFile).toHaveBeenCalledWith(
      expect.objectContaining({ autoStart: true }),
      'settings.json'
    )
  })

  it('should maintain version information in settings', async () => {
    const settings = await settingsStore.getSettings()
    expect(settings.version).toBe('0.9.2')
    expect(settings.version_code).toBe(9.2)
  })

  it('should handle outdated version code by creating new settings', async () => {
    vi.mocked(readFromFile).mockResolvedValueOnce({
      ...mockSettings,
      version_code: 9.1
    })
    const settings = await settingsStore.loadSettings()
    expect(settings).toEqual(expect.objectContaining(mockSettings))
    expect(writeToFile).toHaveBeenCalled()
  })

  it('should save settings correctly', async () => {
    const newSettings: Settings = {
      ...mockSettings,
      minimizeApp: false
    }
    await settingsStore.saveSettings(newSettings)
    expect(writeToFile).toHaveBeenCalledWith(newSettings, 'settings.json')
  })
})

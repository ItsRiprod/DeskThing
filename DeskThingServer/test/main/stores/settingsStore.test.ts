import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import SettingsStore from '@server/stores/settingsStore'
import { LOGGING_LEVEL } from '@shared/types'

vi.mock('fs')
vi.mock('os')
vi.mock('auto-launch', () => ({
  default: vi.fn().mockImplementation(() => ({
    enable: vi.fn(),
    disable: vi.fn()
  }))
}))

vi.mock('@server/stores/loggingStore', () => ({
  default: {
    log: vi.fn()
  }
}))

describe('SettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(fs, 'writeFileSync').mockReturnValue(undefined)
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
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

  it('should return localhost when no valid network interfaces are found', async () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({} as NodeJS.Dict<os.NetworkInterfaceInfo[]>)
    const settings = await SettingsStore.getSettings()
    expect(settings.localIp).toEqual(['127.0.0.1'])
  })

  it('should notify all listeners when settings are updated', async () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    SettingsStore.addListener(listener1)
    SettingsStore.addListener(listener2)

    await SettingsStore.updateSetting('minimizeApp', false)

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('should handle auto-launch setting updates', async () => {
    await SettingsStore.updateSetting('autoStart', true)
    const settings = await SettingsStore.getSettings()
    expect(settings.autoStart).toBe(true)
  })

  it('should maintain version information in settings', async () => {
    const settings = await SettingsStore.getSettings()
    expect(settings.version).toBeDefined()
    expect(settings.version_code).toBeDefined()
  })

  it('should handle missing settings file gracefully', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const settings = await SettingsStore.loadSettings()
    expect(settings).toEqual(
      expect.objectContaining({
        callbackPort: 8888,
        devicePort: 8891,
        address: '0.0.0.0',
        LogLevel: LOGGING_LEVEL.PRODUCTION
      })
    )
  })
})

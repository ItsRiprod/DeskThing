/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loadAndRunEnabledApps } from '@server/services/apps/appRunner'
import { MESSAGE_TYPES } from '@DeskThing/types'
import Logger from '@server/utils/logger'

vi.mock('@server/utils/logger', () => ({
  default: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('@server/stores', () => ({
  appStore: {
    getAll: vi.fn(),
    run: vi.fn()
  }
}))

describe('appRunner', () => {
  let mockAppStore: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { appStore } = await import('@server/stores')
    mockAppStore = appStore
  })

  it('should run all enabled apps successfully', async () => {
    const mockApps = [
      { name: 'app1', enabled: true, running: false },
      { name: 'app2', enabled: true, running: false },
      { name: 'app3', enabled: false, running: false }
    ]
    mockAppStore.getAll.mockReturnValue(mockApps)
    mockAppStore.run.mockImplementation((appName: string) => {
      const app = mockApps.find((app) => app.name === appName)
      if (app) app.running = true
      return Promise.resolve()
    })

    await loadAndRunEnabledApps()

    expect(mockAppStore.run).toHaveBeenCalledTimes(2)
    expect(mockAppStore.run).toHaveBeenCalledWith('app1')
    expect(mockAppStore.run).toHaveBeenCalledWith('app2')
    expect(Logger.info).toHaveBeenCalledWith('Loaded apps config. Running apps...', {
      source: 'loadAndRunEnabledApps'
    })
  })

  it('should retry failed apps', async () => {
    const mockApps = [
      { name: 'app1', enabled: true, running: false },
      { name: 'app2', enabled: true, running: false }
    ]
    mockAppStore.getAll.mockReturnValue(mockApps)
    mockAppStore.run.mockImplementation((appName) => {
      const app = mockApps.find((app) => app.name === appName)
      if (app) app.running = false
      return Promise.resolve()
    })

    await loadAndRunEnabledApps()

    expect(mockAppStore.run).toHaveBeenCalledTimes(4)
    expect(Logger.info).toHaveBeenCalledWith('SERVER: Attempting to run app1 again', {
      source: 'loadAndRunEnabledApps'
    })
    expect(Logger.info).toHaveBeenCalledWith('SERVER: Attempting to run app2 again', {
      source: 'loadAndRunEnabledApps'
    })
  })

  it('should handle errors during app loading', async () => {
    mockAppStore.getAll.mockImplementation(() => {
      throw new Error('Failed to load apps')
    })

    await loadAndRunEnabledApps()

    expect(Logger.log).toHaveBeenCalledWith(
      MESSAGE_TYPES.ERROR,
      'SERVER: Error loading and running enabled apps',
      {
        source: 'loadAndRunEnabledApps',
        error: expect.any(Error)
      }
    )
  })

  it('should handle errors during app running', async () => {
    const mockApps = [{ name: 'app1', enabled: true, running: false }]
    mockAppStore.getAll.mockReturnValue(mockApps)
    mockAppStore.run.mockRejectedValue(new Error('Failed to run app'))

    await loadAndRunEnabledApps()

    expect(mockAppStore.run).toHaveBeenCalledWith('app1')
    expect(Logger.log).toHaveBeenCalledWith(
      MESSAGE_TYPES.ERROR,
      'SERVER: Error loading and running enabled apps',
      {
        source: 'loadAndRunEnabledApps',
        error: expect.any(Error)
      }
    )
  })

  it('should not run disabled apps', async () => {
    const mockApps = [
      { name: 'app1', enabled: false, running: false },
      { name: 'app2', enabled: false, running: false }
    ]
    mockAppStore.getAll.mockReturnValue(mockApps)

    await loadAndRunEnabledApps()

    expect(mockAppStore.run).not.toHaveBeenCalled()
    expect(Logger.info).toHaveBeenCalledWith('Loaded apps config. Running apps...', {
      source: 'loadAndRunEnabledApps'
    })
  })
})

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { AppStore } from '@server/stores/appStore'
import { AppProcessStoreClass } from '@shared/stores/appProcessStore'
import { App, APP_REQUESTS } from '@deskthing/types'
import Logger from '@server/utils/logger'
import { AuthStoreClass } from '@shared/stores/authStore'
import { ReleaseStoreClass } from '@shared/stores/releaseStore'
import { NotificationStoreClass } from '@shared/stores/notificationStore'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn()
  }
}))

vi.mock('@server/stores', () => ({
  storeProvider: {
    getInstance: vi.fn(),
    getStore: vi.fn(),
    clearAllCaches: vi.fn(),
    saveAllToFile: vi.fn(),
    initialize: vi.fn()
  }
}))

vi.mock('@server/stores/storeProvider', () => ({
  getInstance: vi.fn(),
  getStore: vi.fn(),
  clearAllCaches: vi.fn(),
  saveAllToFile: vi.fn(),
  initialize: vi.fn()
}))

vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('@server/services/files/appFileService', () => ({
  getAppData: vi.fn().mockResolvedValue({}),
  setAppData: vi.fn(),
  setAppsData: vi.fn()
}))

vi.mock('@server/services/apps/appRunner', () => ({
  loadAndRunEnabledApps: vi.fn()
}))

vi.mock('node:fs/promises', () => ({
  stat: vi.fn()
}))

describe('AppStore', () => {
  let appStore: AppStore
  let mockAppProcessStore: AppProcessStoreClass
  let mockAuthStore: AuthStoreClass
  let mockReleaseStore: ReleaseStoreClass
  let mockNotificationStore: NotificationStoreClass

  beforeEach(() => {
    mockAppProcessStore = {
      on: vi.fn(),
      postMessage: vi.fn(),
      spawnProcess: vi.fn(),
      terminateProcess: vi.fn(),
      getActiveProcessIds: vi.fn().mockReturnValue(['testApp'])
    } as unknown as AppProcessStoreClass

    mockAuthStore = {
      on: vi.fn()
    } as unknown as AuthStoreClass

    mockReleaseStore = {
      on: vi.fn()
    } as unknown as ReleaseStoreClass

    mockNotificationStore = {
      on: vi.fn()
    } as unknown as NotificationStoreClass

    appStore = new AppStore(mockAppProcessStore, mockAuthStore, mockReleaseStore, mockNotificationStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('App Management', () => {
    it('should add new app correctly', () => {
      const testApp: App = {
        name: 'testApp',
        manifest: {
          label: 'Test App',
          version: '1.0.0',
          id: '',
          requires: [],
          tags: [],
          requiredVersions: {
            server: '',
            client: ''
          }
        },
        enabled: false,
        running: false,
        timeStarted: 0,
        prefIndex: 0
      }

      appStore.add(testApp)
      expect(appStore.get('testApp')).toEqual(testApp)
      expect(appStore.getOrder()).toContain('testApp')
    })

    it('should merge existing app data when adding', () => {
      const initialApp: App = {
        name: 'testApp',
        manifest: {
          label: 'Test App',
          version: '1.0.0',
          id: '',
          requires: [],
          tags: [],
          requiredVersions: {
            server: '',
            client: ''
          }
        },
        enabled: true,
        running: false,
        timeStarted: 0,
        prefIndex: 0
      }

      const updatedApp: App = {
        name: 'testApp',
        manifest: {
          label: 'Test App',
          version: '2.0.0',
          id: '',
          requires: [],
          tags: [],
          requiredVersions: {
            server: '',
            client: ''
          }
        },
        enabled: false,
        running: false,
        timeStarted: 0,
        prefIndex: 0
      }

      appStore.add(initialApp)
      appStore.add(updatedApp)

      expect(appStore.get('testApp')).toEqual({
        ...initialApp,
        ...updatedApp
      })
    })

    it('should handle app reordering', () => {
      const apps = ['app1', 'app2', 'app3'].map((name) => ({
        name,
        manifest: {
          label: name,
          version: '1.0.0',
          id: '',
          requires: [],
          tags: [],
          requiredVersions: {
            server: '',
            client: ''
          }
        },
        enabled: false,
        running: false,
        timeStarted: 0,
        prefIndex: 0
      }))

      apps.forEach((app) => appStore.add(app))
      appStore.reorder(['app2', 'app1', 'app3'])

      expect(appStore.getOrder()).toEqual(['app2', 'app1', 'app3'])
    })

    it('should disable running app', async () => {
      const appName = 'testApp'
      appStore.add({
        name: appName,
        manifest: {
          label: 'Test App',
          version: '1.0.0',
          id: '',
          requires: [],
          tags: [],
          requiredVersions: {
            server: '',
            client: ''
          }
        },
        enabled: true,
        running: false,
        timeStarted: 0,
        prefIndex: 0
      })

      await appStore.disable(appName)

      expect(mockAppProcessStore.terminateProcess).toHaveBeenCalledWith(appName)
      expect(appStore.get(appName)?.enabled).toBe(false)
    })

    it('should handle app message subscription', () => {
      const mockListener = vi.fn()
      const mockFilters = { app: 'testApp' }

      const result = appStore.onAppMessage(APP_REQUESTS.TOAPP, mockListener, mockFilters)

      expect(mockAppProcessStore.on).toHaveBeenCalledWith(APP_REQUESTS.TOAPP, expect.any(Function))
      expect(typeof result).toBe('function')
    })
    it('should validate required apps before starting', async () => {
      const app: App = {
        name: 'testApp',
        manifest: {
          label: 'Test App',
          version: '1.0.0',
          id: '',
          requires: ['requiredApp1', 'requiredApp2'],
          tags: [],
          requiredVersions: {
            server: '',
            client: ''
          }
        },
        enabled: true,
        running: false,
        timeStarted: 0,
        prefIndex: 0
      }

      appStore.add(app)
      const result = await appStore.start('testApp')

      expect(result).toBe(false)
      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing required apps'),
        expect.any(Object)
      )
    })
  })
})

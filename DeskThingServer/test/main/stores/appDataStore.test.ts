import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { AppDataStore } from '../../../src/main/stores/appDataStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { TaskStoreClass } from '@shared/stores/taskStore'
import {
  ServerEvent,
  Task,
  Step,
  STEP_TYPES,
  SETTING_TYPES,
  SettingsType,
  AppSettings
} from '@DeskThing/types'
import Logger from '@server/utils/logger'

vi.mock('@server/services/files/dataFileService', () => ({
  getData: vi.fn(),
  setData: vi.fn(),
  overwriteData: vi.fn(),
  purgeAppData: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn()
  }
}))
vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))
describe('AppDataStore', () => {
  let appDataStore: AppDataStore
  let mockAppStore: AppStoreClass
  let mockTaskStore: TaskStoreClass

  beforeEach(() => {
    mockAppStore = {
      get: vi.fn().mockReturnValue({ manifest: { version: '0.0.0'}}),
      getOrder: vi.fn().mockReturnValue(['app1', 'app2']),
      onAppMessage: vi.fn(),
      sendDataToApp: vi.fn()
    } as unknown as AppStoreClass

    mockTaskStore = {
      on: vi.fn()
    } as unknown as TaskStoreClass

    appDataStore = new AppDataStore(mockAppStore)
    appDataStore.setupListeners(mockTaskStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Task Management', () => {
    it('should update a task step correctly', async () => {
      const mockStep: Partial<Step> = {
        id: 'step1',
        type: STEP_TYPES.STEP,
        label: 'Test Step',
        completed: false
      }

      const mockTask: Task = {
        id: 'task1',
        label: 'Test Task',
        source: 'app1',
        steps: {},
        version: '',
        completed: false,
        started: false
      }

      vi.spyOn(appDataStore, 'getTask').mockResolvedValue(mockTask)

      await appDataStore.updateStep('app1', 'task1', mockStep)

      expect(mockAppStore.sendDataToApp).toHaveBeenCalledWith('app1', {
        type: ServerEvent.TASKS,
        request: 'step',
        payload: mockStep
      })
    })

    it('should handle invalid step updates', async () => {
      const invalidStep = {
        id: 'step1'
      }

      await appDataStore.updateStep('app1', 'task1', invalidStep)

      expect(Logger.error).toHaveBeenCalledWith('Invalid step', expect.any(Object))
    })

    it('should complete a task step', async () => {
      const mockTask: Task = {
        id: 'task1',
        label: 'Test Task',
        source: 'app1',
        steps: {
          step1: {
            id: 'step1',
            type: STEP_TYPES.STEP,
            label: 'Test Step',
            completed: false
          }
        },
        version: '',
        completed: false,
        started: false
      }

      vi.spyOn(appDataStore, 'getTask').mockResolvedValue(mockTask)

      await appDataStore.completeStep(mockTask, 'step1')

      expect(mockAppStore.sendDataToApp).toHaveBeenCalledWith('app1', {
        type: ServerEvent.TASKS,
        payload: expect.objectContaining({
          completed: true,
          parentId: 'task1'
        }),
        request: 'step'
      })
    })

    it('should handle completing step for non-existent task', async () => {
      vi.spyOn(appDataStore, 'getTask').mockResolvedValue(undefined)

      const mockTaskRef: Task = {
        id: 'nonexistent',
        label: 'Missing Task',
        source: 'app1',
        version: '',
        completed: false,
        started: false,
        steps: {}
      }

      await appDataStore.completeStep(mockTaskRef, 'step1')

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('was not found'),
        expect.any(Object)
      )
    })
  })

  describe('Settings Management', () => {
    it('should add new setting correctly', async () => {
      const mockSetting: SettingsType = {
        value: 'test',
        type: SETTING_TYPES.STRING,
        label: 'Test Setting'
      }

      vi.spyOn(appDataStore, 'getSettings').mockResolvedValue({})

      await appDataStore.addSetting('app1', 'newSetting', mockSetting)

      expect(appDataStore['appDataCache']['app1'].settings).toEqual({
        newSetting: mockSetting
      })
    })

    it('should update existing setting', async () => {
      const existingSettings: AppSettings = {
        setting1: { value: 'old', type: SETTING_TYPES.STRING, label: 'Test Setting' }
      }

      const newSetting: SettingsType = {
        value: 'new',
        type: SETTING_TYPES.STRING,
        label: 'Test Setting'
      }

      vi.spyOn(appDataStore, 'getSettings').mockResolvedValue(existingSettings)

      await appDataStore.addSetting('app1', 'setting1', newSetting)

      expect(appDataStore['appDataCache']['app1'].settings).toEqual({
        setting1: newSetting
      })
    })
  })
})

import logger from '@server/utils/logger'
import { updateLoadingStatus } from '@server/windows/loadingWindow'
import {
  IPC_HANDLERS,
  AppIPCData,
  IPC_APP_TYPES,
  ClientIPCData,
  UtilityIPCData,
  PlatformIPC,
  IPC_CLIENT_TYPES,
  IPC_UTILITY_TYPES,
  DeviceIPCData,
  FeedbackIPCData,
  ReleaseIPCData,
  TaskIPCData,
  UpdateIPCData
} from '@shared/types'

export const initializeIpcHandlers = async (ipcMain: Electron.IpcMain): Promise<void> => {
  updateLoadingStatus('Setting up IPC handlers...')

  ipcMain.handle(
    IPC_HANDLERS.APPS,
    async <T extends IPC_APP_TYPES>(_event: unknown, data: Extract<AppIPCData, { type: T }>) => {
      const { appHandler } = await import('./appIpc')
      const handler = appHandler[data.type]
      try {
        if (handler) {
          return await handler(data)
        } else {
          logger.error(`No handler found for type: ${data.type}`, {
            domain: 'server',
            source: 'ipcHandlers',
            function: 'APPS',
            error: new Error(`Unhandled type: ${data.type}`)
          })
          return
        }
      } catch (error) {
        logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
          domain: 'server',
          source: 'ipcHandlers',
          function: 'APPS',
          error: error instanceof Error ? error : new Error(String(error))
        })
        return
      }
    }
  )

  // Handle client-related IPC messages
  ipcMain.handle(
    IPC_HANDLERS.CLIENT,
    async <T extends IPC_CLIENT_TYPES>(
      _event: unknown,
      data: Extract<ClientIPCData, { type: T }>
    ) => {
      const { clientHandler } = await import('./clientIpc')
      const handler = clientHandler[data.type]
      try {
        if (handler) {
          return await handler(data)
        } else {
          logger.error(`No handler found for type: ${data.type}`, {
            domain: 'server',
            source: 'ipcHandlers',
            function: 'CLIENT',
            error: new Error(`Unhandled type: ${data.type}`)
          })
          return
        }
      } catch (error) {
        logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
          domain: 'server',
          source: 'ipcHandlers',
          function: 'CLIENT',
          error: error instanceof Error ? error : new Error(String(error))
        })
        return
      }
    }
  )

  // Handle utility-related IPC messages
  ipcMain.handle(
    IPC_HANDLERS.UTILITY,
    async <T extends IPC_UTILITY_TYPES>(
      _event: unknown,
      data: Extract<UtilityIPCData, { type: T }>
    ) => {
      const { utilityHandler } = await import('./utilityIpc')
      const handler = utilityHandler[data.type]

      try {
        if (handler) {
          return await handler(data)
        } else {
          logger.error(`No handler found for type: ${data.type}`, {
            domain: 'server',
            source: 'ipcHandlers',
            function: 'UTILITY',
            error: new Error(`Unhandled type: ${data.type}`)
          })
          return
        }
      } catch (error) {
        logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
          domain: 'server',
          source: 'ipcHandlers',
          function: 'UTILITY',
          error: error instanceof Error ? error : new Error(String(error))
        })
        return
      }
    }
  )

  // Handle platform-related IPC messages
  ipcMain.handle(IPC_HANDLERS.PLATFORM, async (_event, data: PlatformIPC) => {
    const { platformHandler } = await import('./platformIpc')

    try {
      return await platformHandler(data)
    } catch (error) {
      logger.error(`Error in IPC handler with event ${data.platform}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'PLATFORM',
        error: error instanceof Error ? error : new Error(String(error))
      })
      return
    }
  })

  // Handle device-related IPC messages
  ipcMain.handle(IPC_HANDLERS.DEVICE, async (_event, data: DeviceIPCData) => {
    const { deviceHandler } = await import('./deviceIpc')

    try {
      return await deviceHandler(data)
    } catch (error) {
      logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'DEVICE',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Handle feedback-related IPC messages
  ipcMain.handle(IPC_HANDLERS.FEEDBACK, async (_event, data: FeedbackIPCData) => {
    const { feedbackHandler } = await import('./feedbackIpc')

    try {
      return await feedbackHandler(data)
    } catch (error) {
      logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'FEEDBACK',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Handle releases-related IPC messages
  ipcMain.handle(IPC_HANDLERS.RELEASE, async (_event, data: ReleaseIPCData) => {
    const { releaseHandler } = await import('./releasesIpc')

    try {
      return await releaseHandler(data)
    } catch (error) {
      logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'RELEASES',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Handle task-related IPC messages
  ipcMain.handle(IPC_HANDLERS.TASK, async (_event, data: TaskIPCData) => {
    const { taskHandler } = await import('./taskIpc')

    try {
      return await taskHandler(data)
    } catch (error) {
      logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'TASK',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Handle update-related IPC messages
  ipcMain.handle(IPC_HANDLERS.UPDATE, async (_event, data: UpdateIPCData) => {
    const { updateHandler } = await import('./updateIpc')

    try {
      return await updateHandler(data)
    } catch (error) {
      logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'UPDATE',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })
}

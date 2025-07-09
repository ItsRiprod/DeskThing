console.log('[Auth Handler] Starting')
import { LOGGING_LEVELS, DESKTHING_DEVICE, PlatformIDs } from '@deskthing/types'
import {
  IPC_CLIENT_TYPES,
  ClientHandlerReturnType,
  ClientIPCData,
  ProgressChannel,
  SCRIPT_IDs
} from '@shared/types'
import Logger from '@server/utils/logger'
import { handleAdbCommands } from '../../handlers/adbHandler'
import { storeProvider } from '@server/stores/storeProvider'
import { progressBus } from '@server/services/events/progressBus'
import { getClientWindow } from '@server/windows/windowManager'
import { handleError } from '@server/utils/errorHandler'

/**
 * The `clientHandler` object is a mapping of client IPC (Inter-Process Communication) data types to handler functions. These handlers are responsible for processing various client-related requests, such as pinging clients, handling URL-based web app downloads, configuring devices, managing client manifests, and more.
 *
 * Each handler function takes two arguments: `data` (the client IPC data) and `replyFn` (a function to send a response back to the client). The handler functions return a Promise that resolves to a value that depends on the specific handler (e.g., a string, a `ClientManifest`, or `void`).
 *
 * The handlers are responsible for logging relevant information, handling errors, and interacting with other parts of the application (e.g., the `deviceHandler`, `mappingStore`, etc.) to fulfill the client's requests.
 */
export const clientHandler: {
  [T in IPC_CLIENT_TYPES]: (
    data: Extract<ClientIPCData, { type: T }>
  ) => Promise<ClientHandlerReturnType<T>>
} = {
  pingClient: async (data) => {
    const platformStore = await storeProvider.getStore('platformStore')
    try {
      platformStore.sendDataToClient({
        app: 'client',
        type: DESKTHING_DEVICE.PING,
        clientId: data.payload
      })
      return `Pinging ${data.payload}...`
    } catch (error) {
      console.error('Error pinging client:', error)
      if (error instanceof Error) {
        Logger.log(LOGGING_LEVELS.ERROR, error.message)
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, String(error))
      }
      return 'Error pinging' + data.payload
    }
  },

  zip: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_CLIENT, 'Upload ZIP', 'Initializing...', [
      {
        channel: ProgressChannel.ST_CLIENT_INSTALL,
        weight: 100
      }
    ])

    const clientStore = await storeProvider.getStore('clientStore')

    try {
      await clientStore.loadClientFromZip(data.payload)
    } catch (error) {
      progressBus.warn(
        ProgressChannel.IPC_CLIENT,
        'zip',
        'Error loading zip file',
        handleError(error)
      )
    }

    progressBus.complete(
      ProgressChannel.IPC_CLIENT,
      'Upload ZIP',
      'Zip File uploaded successfully!'
    )
  },

  url: async (data) => {
    const clientStore = await storeProvider.getStore('clientStore')
    console.log('Handling URL download')
    progressBus.startOperation(
      ProgressChannel.IPC_CLIENT,
      'Download Client',
      'Loading web app from URL',
      [
        {
          channel: ProgressChannel.ST_CLIENT_DOWNLOAD,
          weight: 100
        }
      ]
    )

    try {
      await clientStore.loadClientFromURL(data.payload)
    } catch (error) {
      progressBus.warn(ProgressChannel.IPC_CLIENT, 'url', 'Error loading URL', handleError(error))
    }

    progressBus.complete(ProgressChannel.IPC_CLIENT, 'Download Client', 'Web app loaded from URL')

    return
  },

  adb: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_CLIENT, 'adb', 'Working', [
      {
        channel: ProgressChannel.ADB,
        weight: 100
      }
    ])
    try {
      const response = await handleAdbCommands(data.payload)
      Logger.info(`adb response: ${response}`, {
        function: 'handle adb',
        source: 'clientHandler'
      })
      progressBus.complete(ProgressChannel.IPC_CLIENT, response)
      return response
    } catch (error) {
      Logger.error(`Error handling adb commands`, {
        function: 'handleAdbCommands',
        source: 'clientHandler',
        error: error as Error
      })
      return handleError(error)
    }
  },

  'client-manifest': async (data) => {
    const platformStore = await storeProvider.getStore('platformStore')
    const clientStore = await storeProvider.getStore('clientStore')
    if (data.type != IPC_CLIENT_TYPES.CLIENT_MANIFEST) return

    switch (data.request) {
      case 'get-device': {
        progressBus.start(ProgressChannel.IPC_CLIENT, 'client-manifest', 'Getting Client Manifest')
        const response = await platformStore.sendPlatformData({
          platform: PlatformIDs.ADB,
          type: 'get',
          request: 'manifest',
          adbId: data.payload
        })
        progressBus.complete(ProgressChannel.IPC_CLIENT, 'client-manifest', 'Manifest received!')
        return response
      }
      case 'set-device': {
        await platformStore.sendPlatformData({
          platform: PlatformIDs.ADB,
          type: 'set',
          request: 'manifest',
          manifest: data.payload.client,
          adbId: data.payload.adbId
        })
        return
      }
      case 'get':
        {
          progressBus.startOperation(
            ProgressChannel.IPC_CLIENT,
            'client-manifest',
            'Getting Staged Client!',
            [
              {
                channel: ProgressChannel.ST_CLIENT_REFRESH,
                weight: 10
              }
            ]
          )

          const response = await clientStore.refreshClient()

          if (!response) {
            progressBus.error(
              ProgressChannel.IPC_CLIENT,
              'client-manifest',
              'Failed to get staged client!'
            )
            return null
          }

          progressBus.complete(ProgressChannel.IPC_CLIENT, 'client-manifest', 'Manifest received!')
          return response
        }
        break
      case 'set': {
        break
      }
    }
    return
  },

  'push-staged': async (data) => {
    try {
      progressBus.startOperation(
        ProgressChannel.IPC_CLIENT,
        'push-staged',
        'Pushing staged app...',
        [
          {
            channel: ProgressChannel.PLATFORM_CHANNEL,
            weight: 5
          }
        ]
      )
      const platformStore = await storeProvider.getStore('platformStore')
      await platformStore.sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'push',
        request: 'staged',
        adbId: data.payload.adbId
      })
      // HandlePushWebApp(data.payload)
      progressBus.complete(ProgressChannel.IPC_CLIENT, 'push-staged', 'Staged app pushed!')
    } catch (error) {
      progressBus.error(
        ProgressChannel.IPC_CLIENT,
        'push-staged',
        'Failed to push staged app!',
        String(error)
      )
      if (error instanceof Error) {
        Logger.log(LOGGING_LEVELS.ERROR, error.message)
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, String(error))
      }
    }
  },

  'push-proxy-script': async (data) => {
    try {
      progressBus.startOperation(
        ProgressChannel.IPC_CLIENT,
        'push-proxy-script',
        'Pushing proxy script...',
        [
          {
            channel: ProgressChannel.PLATFORM_CHANNEL,
            weight: 5
          }
        ]
      )
      const platformStore = await storeProvider.getStore('platformStore')
      const response = await platformStore.sendPlatformData({
        platform: PlatformIDs.ADB,
        type: 'push',
        request: 'script',
        scriptId: SCRIPT_IDs.PROXY,
        adbId: data.payload
      })
      progressBus.complete(
        ProgressChannel.IPC_CLIENT,
        `Proxy script pushed ${response ? 'successfully' : 'unsuccessfully'}!`,
        `proxy-script`
      )
    } catch (error) {
      progressBus.error(
        ProgressChannel.IPC_CLIENT,
        'push-proxy',
        'Failed to push proxy!',
        String(error)
      )
      console.error('Error pushing proxy script:', error)
      if (error instanceof Error) {
        Logger.log(LOGGING_LEVELS.ERROR, error.message)
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, String(error))
      }
    }
  },

  'run-device-command': async (data) => {
    const platformStore = await storeProvider.getStore('platformStore')

    progressBus.startOperation(
      ProgressChannel.IPC_CLIENT,
      'run-device-command',
      'Running command on device',
      [
        {
          channel: ProgressChannel.PLATFORM_CHANNEL,
          weight: 5
        }
      ]
    )

    const response = platformStore.sendPlatformData({
      platform: PlatformIDs.ADB,
      type: 'run',
      request: 'command',
      command: data.payload.command,
      adbId: data.payload.clientId
    })

    progressBus.complete(ProgressChannel.IPC_CLIENT, 'run-device-command', 'Finished')
    return response
  },

  icon: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'get':
        return await mappingStore.fetchActionIcon(data.payload)
      case 'set':
        return await mappingStore.updateIcon(data.payload.id, data.payload.icon)
    }
  },

  [IPC_CLIENT_TYPES.OPEN_CLIENT]: async () => {
    const { storeProvider } = await import('@server/stores/storeProvider')
    const settingsStore = await storeProvider.getStore('settingsStore')
    const devicePort = await settingsStore.getSetting('device_devicePort')
    if (devicePort) {
      getClientWindow(devicePort)
    }
    return true
  },

  [IPC_CLIENT_TYPES.DOWNLOAD_LATEST]: async () => {
    const { storeProvider } = await import('@server/stores/storeProvider')
    try {
      progressBus.startOperation(
        ProgressChannel.IPC_CLIENT,
        'Downloading Latest Client',
        'Staging Download...',
        [
          {
            channel: ProgressChannel.ST_RELEASE_CLIENT_DOWNLOAD,
            weight: 5
          }
        ]
      )
      const clientStore = await storeProvider.getStore('clientStore')
      const clientManifest = await clientStore.downloadLatestClient()
      progressBus.complete(
        ProgressChannel.IPC_CLIENT,
        `Client downloaded ${clientManifest ? 'successfully' : 'unsuccessfully'}!`,
        `Downloaded Latest Client`
      )
      return clientManifest
    } catch (error) {
      progressBus.error(
        ProgressChannel.IPC_CLIENT,
        'Download Latest Client',
        'Failed to download latest client',
        handleError(error)
      )
      return
    }
  }
}

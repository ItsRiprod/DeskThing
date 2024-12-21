console.log('[Auth Handler] Starting')
import { ClientIPCData, ClientManifest, SocketData, ReplyFn, MESSAGE_TYPES } from '@shared/types'
import loggingStore from '../stores/loggingStore'
import { handleAdbCommands } from './adbHandler'
import {
  configureDevice,
  getClientManifest,
  handleClientManifestUpdate,
  HandlePushWebApp,
  HandleWebappZipFromUrl,
  SetupProxy
} from './deviceHandler'
import { sendMessageToClient, sendMessageToClients } from '../services/client/clientCom'
import mappingStore from '@server/services/mappings/mappingStore'

/**
 * The `clientHandler` object is a mapping of client IPC (Inter-Process Communication) data types to handler functions. These handlers are responsible for processing various client-related requests, such as pinging clients, handling URL-based web app downloads, configuring devices, managing client manifests, and more.
 *
 * Each handler function takes two arguments: `data` (the client IPC data) and `replyFn` (a function to send a response back to the client). The handler functions return a Promise that resolves to a value that depends on the specific handler (e.g., a string, a `ClientManifest`, or `void`).
 *
 * The handlers are responsible for logging relevant information, handling errors, and interacting with other parts of the application (e.g., the `deviceHandler`, `mappingStore`, etc.) to fulfill the client's requests.
 */
export const clientHandler: Record<
  ClientIPCData['type'],
  (data: ClientIPCData, replyFn: ReplyFn) => Promise<void | string | ClientManifest | null>
> = {
  pingClient: async (data, replyFn) => {
    try {
      replyFn('logging', {
        status: false,
        error: 'Not implemented!',
        data: `Attempted to ping ${data.payload}!`,
        final: true
      })
      sendMessageToClient(data.payload, { app: 'client', type: 'ping' })
      return `Pinging ${data.payload}...`
    } catch (error) {
      console.error('Error pinging client:', error)
      if (error instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, error.message)
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, String(error))
      }
      return 'Error pinging' + data.payload
    }
  },

  zip: async (_data, replyFn) => {
    replyFn('logging', {
      status: false,
      data: 'Zip File not supported!',
      error: 'Zip File not supported!',
      final: true
    })
  },
  url: async (data, replyFn) => {
    return handleUrl(data, replyFn)
  },
  adb: async (data, replyFn) => {
    replyFn('logging', { status: true, data: 'Working', final: false })

    const response = await handleAdbCommands(data.payload, replyFn)
    replyFn('logging', { status: true, data: response, final: true })
    return response
  },
  configure: async (data, replyFn) => {
    replyFn('logging', { status: true, data: 'Configuring Device', final: false })
    const response = await configureDevice(data.payload, replyFn)
    replyFn('logging', { status: true, data: 'Device Configured!', final: true })
    return response
  },
  'client-manifest': async (data, replyFn) => {
    if (data.request === 'get') {
      const response = await getClientManifest(replyFn)
      replyFn('logging', { status: true, data: response, final: true })
      return response
    } else if (data.request === 'set') {
      return await handleClientManifestUpdate(data.payload, replyFn)
    }
    return
  },
  'push-staged': async (data, replyFn) => {
    try {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'Pushing staged app...')
      HandlePushWebApp(data.payload, replyFn)
    } catch (error) {
      replyFn('logging', {
        status: false,
        data: error,
        error: 'Failed to push staged app!',
        final: true
      })
      if (error instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, error.message)
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, String(error))
      }
    }
  },
  'push-proxy-script': async (data, replyFn) => {
    try {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'Pushing proxy script...')
      SetupProxy(replyFn, data.payload)
      replyFn('logging', {
        status: true,
        data: 'Proxy script pushed!',
        final: true
      })
    } catch (error) {
      replyFn('logging', {
        status: false,
        data: error,
        error: 'Failed to push proxy!',
        final: true
      })
      console.error('Error pushing proxy script:', error)
      if (error instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, error.message)
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, String(error))
      }
    }
  },
  'run-device-command': async (data, replyFn) => {
    const payload = data.payload.payload as string

    const message: SocketData = {
      app: data.payload.app || 'client',
      type: data.payload.type,
      request: data.payload.request,
      payload: !payload.includes('{') ? data.payload.payload : JSON.parse(data.payload.payload)
    }
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return await sendMessageToClients(message)
  },
  icon: async (data) => {
    switch (data.request) {
      case 'get':
        return await mappingStore.fetchActionIcon(data.payload)
      case 'set':
        return await mappingStore.updateIcon(data.payload.id, data.payload.icon)
    }
  }
}

/**
 * Handles the processing of a web app from a URL.
 *
 * This function is responsible for downloading and processing a web app from a URL. It logs the progress of the operation and handles any errors that may occur during the process.
 *
 * @param data - The data object containing the URL of the web app.
 * @param replyFn - The reply function to be used for logging the progress and errors.
 * @returns A Promise that resolves when the web app has been successfully downloaded and processed.
 */
const handleUrl = async (data, replyFn: ReplyFn): Promise<void> => {
  try {
    replyFn('logging', {
      status: true,
      data: 'Handling web app from URL',
      final: false
    })

    await HandleWebappZipFromUrl(replyFn, data.payload)
    replyFn('logging', { status: true, data: 'Successfully downloaded client', final: true })
  } catch (error) {
    console.error('Error extracting zip file:', error)
    if (error instanceof Error) {
      replyFn('logging', {
        status: false,
        error: error.message,
        data: 'Error handling URL',
        final: true
      })
    } else {
      replyFn('logging', {
        status: false,
        error: 'Unable to download CLIENT',
        data: 'Error handling URL',
        final: true
      })
    }
  }
}

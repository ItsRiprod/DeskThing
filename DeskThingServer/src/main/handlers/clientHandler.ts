import { ClientIPCData } from '@shared/types/ipcTypes'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { handleAdbCommands } from './adbHandler'
import {
  getClientManifest,
  HandlePushWebApp,
  HandleWebappZipFromUrl,
  SetupProxy
} from './deviceHandler'
import { sendData } from './websocketServer'

export const clientHandler: Record<
  ClientIPCData['type'],
  (data: ClientIPCData, event: Electron.IpcMainInvokeEvent) => Promise<any>
> = {
  zip: async (_data, event) => {
    event.sender.send('logging', {
      status: false,
      data: 'Zip File not supported!',
      error: 'Zip File not supported!',
      final: true
    })
  },
  url: async (data, event) => {
    handleUrl(data, event)
  },
  adb: async (data, event) => {
    console.log('Running ADB command:', data.payload)
    event.sender.send('logging', { status: true, data: 'Working', final: false })

    const reply = async (status, data, final, error): Promise<void> => {
      event.sender.send('logging', {
        status: status,
        data: data,
        final: final,
        error: error
      })
    }

    return await handleAdbCommands(data.payload, reply)
  },
  'client-manifest': async (data, event) => {
    if (data.request === 'get') {
      return await getClientManifest(event.sender.send)
    }
    return
  },
  'push-staged': async (data, event) => {
    try {
      console.log('Pushing staged webapp...')
      HandlePushWebApp(data.payload, event.sender.send)
    } catch (error) {
      event.sender.send('logging', {
        status: false,
        data: error,
        error: 'Failed to push staged app!',
        final: true
      })
      console.error('Error extracting zip file:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
    }
  },
  'push-proxy-script': async (data, event) => {
    try {
      console.log('Pushing proxy script...')
      SetupProxy(event.sender.send, data.payload)
    } catch (error) {
      event.sender.send('logging', {
        status: false,
        data: error,
        error: 'Failed to push proxy!',
        final: true
      })
      console.error('Error pushing proxy script:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
    }
  },
  'run-device-command': async (data, event) => {
    const message = {
      app: data.payload.app || 'client',
      type: data.payload.type,
      data: JSON.parse(data.payload.payload)
    }
    console.log('Sending data', data)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return await sendData(null, message)
  }
}

const handleUrl = (data, event): void => {
  try {
    event.sender.send('logging', {
      status: true,
      data: 'Handling web app from URL',
      final: false
    })
    HandleWebappZipFromUrl(event.sender.send, data.payload)
  } catch (error) {
    console.error('Error extracting zip file:', error)
    event.sender.send('zip-extracted', { success: false, error: error })
  }
}

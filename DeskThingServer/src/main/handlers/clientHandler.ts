import { ClientIPCData, ReplyFn } from '@shared/types/ipcTypes'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { handleAdbCommands } from './adbHandler'
import {
  getClientManifest,
  handleClientManifestUpdate,
  HandlePushWebApp,
  HandleWebappZipFromUrl,
  SetupProxy
} from './deviceHandler'
import { sendData } from './websocketServer'

export const clientHandler: Record<
  ClientIPCData['type'],
  (data: ClientIPCData, replyFn: ReplyFn) => Promise<any>
> = {
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
    console.log('Running ADB command:', data.payload)
    replyFn('logging', { status: true, data: 'Working', final: false })

    const reply = async (status, data, final, error): Promise<void> => {
      replyFn('logging', {
        status: status,
        data: data,
        final: final,
        error: error
      })
    }

    return await handleAdbCommands(data.payload, reply)
  },
  'client-manifest': async (data, replyFn) => {
    if (data.request === 'get') {
      return await getClientManifest(replyFn)
    } else if (data.request === 'set') {
      return await handleClientManifestUpdate(replyFn, data.payload)
    }
    return
  },
  'push-staged': async (data, replyFn) => {
    try {
      console.log('Pushing staged webapp...')
      HandlePushWebApp(data.payload, replyFn)
    } catch (error) {
      replyFn('logging', {
        status: false,
        data: error,
        error: 'Failed to push staged app!',
        final: true
      })
      console.error('Error extracting zip file:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
    }
  },
  'push-proxy-script': async (data, replyFn) => {
    try {
      console.log('Pushing proxy script...')
      SetupProxy(replyFn, data.payload)
    } catch (error) {
      replyFn('logging', {
        status: false,
        data: error,
        error: 'Failed to push proxy!',
        final: true
      })
      console.error('Error pushing proxy script:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
    }
  },
  'run-device-command': async (data, replyFn) => {
    const message = {
      app: data.payload.app || 'client',
      type: data.payload.type,
      data: JSON.parse(data.payload.payload)
    }
    console.log('Sending data', data)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return await sendData(null, message)
  }
}

const handleUrl = (data, replyFn: ReplyFn): void => {
  try {
    replyFn('logging', {
      status: true,
      data: 'Handling web app from URL',
      final: false
    })

    const reply = async (channel: string, data): Promise<void> => {
      replyFn(channel, data)
    }

    HandleWebappZipFromUrl(reply, data.payload)
  } catch (error) {
    console.error('Error extracting zip file:', error)
    if (error instanceof Error) {
      replyFn('zip-extracted', { status: false, error: error.message, data: null, final: true })
    }
  }
}

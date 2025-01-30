console.log('[App Handler] Starting')
import path from 'node:path'
import {
  App,
  AppDataInterface,
  AppIPCData,
  AppReturnData,
  MESSAGE_TYPES,
  ReplyData,
  ReplyFn,
} from '@shared/types/index.ts'
import loggingStore from '../stores/loggingStore.ts'
import { getData, setData } from './dataHandler.ts'
import { BrowserWindow, dialog } from 'electron'
import { AppHandler, sendMessageToApp } from '../services/apps/index.ts'
const appStore = AppHandler.getInstance()

export const appHandler: Record<
  AppIPCData['type'],
  (
    data: AppIPCData,
    replyFn: ReplyFn,
  ) => Promise<
    AppDataInterface | boolean | App[] | undefined | void | null | App | string | AppReturnData
  >
> = {
  app: async (data, replyFn) => {
    if (data.request == 'get') {
      return await getApps(replyFn)
    }
    return
  },
  data: async (data, replyFn) => {
    switch (data.request) {
      case 'get':
        return await getAppData(replyFn, data.payload)
      case 'set':
        return await setAppData(replyFn, data.payload.appId, data.payload.data)
      default:
        return
    }
  },
  stop: async (data, replyFn) => {
    await appStore.stop(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  disable: async (data, replyFn) => {
    await appStore.disable(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  enable: async (data, replyFn) => {
    await appStore.enable(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  run: async (data, replyFn) => {
    await appStore.run(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  purge: async (data, replyFn) => {
    await appStore.purge(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  zip: async (data, replyFn) => {
    /**
     * This needs to be reworked to make a pre-run state and a post-run state
     */
    replyFn('logging', { status: true, data: 'Handling zipped app', final: false })

    const returnData = await appStore.addZIP(data.payload, replyFn) // Extract to user data folder

    if (!returnData) {
      replyFn('logging', {
        status: false,
        data: returnData,
        error: '[handleZip] No data returned!',
        final: true,
      })
      return returnData
    }

    replyFn('logging', { status: true, data: 'Finished', final: true })
    replyFn('zip-name', { status: true, data: returnData, final: true })
    return returnData
  },
  url: async (data, replyFn) => {
    replyFn('logging', { status: true, data: 'Handling app from URL...', final: false })

    const reply = async (channel: string, data: ReplyData): Promise<void> => {
      replyFn(channel, data)
    }

    const returnData = await appStore.addURL(data.payload, reply) // Extract to user data folder
    replyFn('logging', { status: true, data: 'Finished', final: true })
    replyFn('zip-name', { status: true, data: returnData, final: true })
    return returnData
  },

  'user-data-response': async (data) => {
    sendMessageToApp(data.payload.requestId, data.payload.response)
  },
  'select-zip-file': async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
    })
    if (result.canceled) return null

    const filePath = result.filePaths[0]
    return { path: filePath, name: path.basename(filePath) }
  },
  'dev-add-app': async (data, replyFn) => {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      'Developer App Not implemented Yet ',
      data.payload.appPath,
    )
    // await appStore.run('developer-app', appPath)
    replyFn('logging', { status: true, data: 'Finished', final: true })
  },
  'send-to-app': async (data, replyFn) => {
    await sendMessageToApp(data.payload.app, data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
  },
  'app-order': async (data, replyFn) => {
    appStore.reorder(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
  },
}

const getApps = (replyFn: ReplyFn): App[] => {
  replyFn('logging', { status: true, data: 'Getting data', final: false })
  const data = appStore.getAllBase()
  replyFn('logging', { status: true, data: 'Finished', final: true })
  replyFn('app-data', { status: true, data: data, final: true })
  return data
}

const setAppData = async (replyFn: ReplyFn, id: string, data: AppDataInterface): Promise<void> => {
  loggingStore.log(MESSAGE_TYPES.LOGGING, 'SERVER: Saving ' + id + "'s data " + data)
  await setData(id, data)
  replyFn('logging', { status: true, data: 'Finished', final: true })
}

const getAppData = async (replyFn: ReplyFn, payload: string): Promise<AppDataInterface | null> => {
  try {
    const data = getData(payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return data
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, 'SERVER: Error saving manifest' + error)
    console.error('Error setting client manifest:', error)
    replyFn('logging', { status: false, data: 'Unfinished', error : error as string, final: true })
    return null
  }
}

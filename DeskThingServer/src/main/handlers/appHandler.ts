import path from 'path'
import { AppIPCData } from '@shared/types/ipcTypes'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { getData, setData } from './dataHandler'
import { dialog, BrowserWindow } from 'electron'
import { sendMessageToApp, AppHandler } from '../services/apps'
import { App, AppDataInterface } from '@shared/types'
const appStore = AppHandler.getInstance()

export const appHandler: Record<
  AppIPCData['type'],
  (data: AppIPCData, event: Electron.IpcMainInvokeEvent) => Promise<any>
> = {
  app: async (data, event) => {
    if (data.request == 'get') {
      return await getApps(event)
    }
    return
  },
  data: async (data, event) => {
    switch (data.request) {
      case 'get':
        return await getAppData(event, data.payload)
      case 'set':
        return await setAppData(event, data.payload.appId, data.payload.data)
      default:
        return
    }
  },
  stop: async (data, event) => {
    await appStore.stop(data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  disable: async (data, event) => {
    await appStore.disable(data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  enable: async (data, event) => {
    await appStore.enable(data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  run: async (data, event) => {
    await appStore.run(data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  purge: async (data, event) => {
    await appStore.purge(data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  zip: async (data, event) => {
    /**
     * This needs to be reworked to make a pre-run state and a post-run state
     */
    event.sender.send('logging', { status: true, data: 'Handling zipped app', final: false })

    const returnData = await appStore.addZIP(data.payload, event) // Extract to user data folder

    if (!returnData) {
      event.sender.send('logging', {
        status: false,
        data: returnData,
        error: '[handleZip] No data returned!',
        final: true
      })
      return
    }

    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    event.sender.send('zip-name', { status: true, data: returnData, final: true })
  },
  url: async (data, event) => {
    event.sender.send('logging', { status: true, data: 'Handling app from URL...', final: false })
    await appStore.addURL(data.payload, event) // Extract to user data folder
  },

  'user-data-response': async (data) => {
    sendMessageToApp(data.payload.requestId, data.payload.response)
  },
  'select-zip-file': async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    })
    if (result.canceled) return null

    const filePath = result.filePaths[0]
    return { path: filePath, name: path.basename(filePath) }
  },
  'dev-add-app': async (data, event) => {
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'Developer App Not implemented Yet ',
      data.payload.appPath
    )
    // await appStore.run('developer-app', appPath)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
  },
  'send-to-app': async (data, event) => {
    console.log('sending data to app: ', data.payload.app, data)
    await sendMessageToApp(data.payload.app, data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
  },
  'app-order': async (data, event) => {
    appStore.reorder(data.payload)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
  }
}

const getApps = (event: Electron.IpcMainInvokeEvent): App[] => {
  event.sender.emit('logging', { status: true, data: 'Getting data', final: false })
  console.log('Getting app data')
  const data = appStore.getAllBase()
  event.sender.emit('logging', { status: true, data: 'Finished', final: true })
  event.sender.emit('app-data', { status: true, data: data, final: true })
  return data
}

const setAppData = async (event, id, data: AppDataInterface): Promise<void> => {
  console.log('Saving app data: ', data)
  dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SERVER: Saving ' + id + "'s data " + data)
  await setData(id, data)
  event.sender.emit('logging', { status: true, data: 'Finished', final: true })
}

const getAppData = async (event, payload): Promise<AppDataInterface | null> => {
  try {
    const data = await getData(payload)
    event.sender.emit('logging', { status: true, data: 'Finished', final: true })
    return data
  } catch (error) {
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'SERVER: Error saving manifest' + error)
    console.error('Error setting client manifest:', error)
    event.sender.emit('logging', { status: false, data: 'Unfinished', error: error, final: true })
    return null
  }
}

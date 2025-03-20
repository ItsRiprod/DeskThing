import { ADBClient, Client } from '@shared/types'
import { sendIpcData } from '../../index'
import Logger from '../../utils/logger'
import { storeProvider } from '../../stores/storeProvider'
import { AppSettings, LOGGING_LEVELS, SEND_TYPES, ServerEvent } from '@deskthing/types'
import { BrowserWindow, ipcMain, shell } from 'electron'

export async function initializeStores(): Promise<void> {
  const { default: cacheManager } = await import('./cacheManager')

  // Register stores for cache management
  const storeList = {
    connectionsStore: await storeProvider.getStore('connectionsStore', false),
    appStore: await storeProvider.getStore('appStore', false),
    mappingStore: await storeProvider.getStore('mappingStore', false),
    musicStore: await storeProvider.getStore('musicStore', false),
    settingsStore: await storeProvider.getStore('settingsStore', false),
    taskStore: await storeProvider.getStore('taskStore', false),
    githubStore: await storeProvider.getStore('githubStore', false),
    AppDataStore: await storeProvider.getStore('appDataStore', false)
  }
  Object.values(storeList).forEach((store) => cacheManager.registerStore(store))

  // Set up store listeners
  storeList.mappingStore.addListener('action', (action) => {
    action && sendIpcData({ type: 'action', payload: action })
  })
  storeList.mappingStore.addListener('key', (key) => {
    key && sendIpcData({ type: 'key', payload: key })
  })
  storeList.mappingStore.addListener('profile', (profile) => {
    profile && sendIpcData({ type: 'profile', payload: profile })
  })

  storeList.connectionsStore.on((clients: Client[]) => {
    sendIpcData({
      type: 'connections',
      payload: { status: true, data: clients.length, final: true }
    })
    sendIpcData({
      type: 'clients',
      payload: { status: true, data: clients, final: true }
    })
  })

  storeList.connectionsStore.onDevice((devices: ADBClient[]) => {
    sendIpcData({
      type: 'adbdevices',
      payload: devices
    })
  })

  storeList.AppDataStore.on('settings', (data) => {
    Logger.debug('[INDEX]: Sending updated setting information with type app-data')

    sendIpcData({
      type: 'app-settings',
      payload: data as { appId: string; data: AppSettings }
    })
  })

  storeList.appStore.on('apps', ({ data }) => {
    Logger.debug('[INDEX]: Sending updated app information with type app-data')
    sendIpcData({
      type: 'app-data',
      payload: data
    })
  })

  storeList.taskStore.on('taskList', (taskList) => {
    sendIpcData({
      type: 'taskList',
      payload: taskList
    })
  })

  storeList.taskStore.on('currentTask', (task) => {
    sendIpcData({
      type: 'currentTask',
      payload: task
    })
  })

  storeList.taskStore.on('task', (task) => {
    sendIpcData({
      type: 'task',
      payload: task
    })
  })

  storeList.githubStore.on('app', (app) => {
    Logger.debug('[INDEX]: Sending updated app information with type github-apps')
    sendIpcData({
      type: 'github-apps',
      payload: app
    })
  })
  storeList.githubStore.on('client', (clients) => {
    Logger.debug('[INDEX]: Sending updated client information with type github-client')
    sendIpcData({
      type: 'github-client',
      payload: clients
    })
  })
  storeList.githubStore.on('community', (community) => {
    Logger.debug('[INDEX]: Sending updated community information with type github-community')
    sendIpcData({
      type: 'github-community',
      payload: community
    })
  })

  storeList.settingsStore.addListener((newSettings) => {
    sendIpcData({
      type: 'settings-updated',
      payload: newSettings
    })
  })

  storeList.appStore.onAppMessage(SEND_TYPES.OPEN, (data) => {
    if (typeof data.payload == 'string') {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length === 0) {
        shell.openExternal(data.payload)
      } else {
        sendIpcData({
          type: 'link-request',
          payload: {
            url: data.payload,
            app: data.source
          }
        })
      }
    } else {
      Logger.warn('App sent invalid payload for openAuthWindow', {
        source: 'appCommunication',
        function: 'handleRequestOpen',
        domain: data.source
      })
    }
  })

  storeList.appStore.onAppMessage(SEND_TYPES.LOG, (data) => {
    if (data.request && Object.values(LOGGING_LEVELS).includes(data.request)) {
      const message =
        typeof data.payload === 'string'
          ? data.payload
          : typeof data.payload === 'object'
            ? JSON.stringify(data.payload)
            : String(data.payload)

      Logger.log(data.request, message, { domain: data.source.toUpperCase() })
    }
  })

  storeList.appStore.onAppMessage(
    SEND_TYPES.GET,
    (data) => {
      if (data.request != 'input') return
      Logger.warn(
        `[handleRequestGetInput]: ${data.source} tried accessing "Input" data type which is depreciated and may be removed at any time!`,
        {
          source: 'appCommunication',
          function: 'handleRequestGetInput',
          domain: data.source
        }
      )
      sendIpcData({
        type: 'display-user-form',
        payload: { requestId: data.source, scope: data.payload }
      })
      ipcMain.once(
        `user-data-response-${data.source}`,
        async (_event, formData: Record<string, string>) => {
          const appStore = await storeProvider.getStore('appStore')
          appStore.sendDataToApp(data.source, {
            type: ServerEvent.INPUT,
            request: 'data',
            payload: formData
          })
        }
      )
    },
    { request: 'input' }
  )
}

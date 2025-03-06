import { ADBClient, Client } from '@shared/types'
import { sendIpcData } from '../../index'
import Logger from '../../utils/logger'
import { storeProvider } from '../../stores/storeProvider'
import { AppSettings, LOGGING_LEVELS, SEND_TYPES, ServerEvent } from '@deskthing/types'
import { ipcMain, shell } from 'electron'

export async function initializeStores(): Promise<void> {
  const { default: cacheManager } = await import('./cacheManager')

  // Register stores for cache management
  const storeList = [
    storeProvider.getStore('connectionsStore'),
    storeProvider.getStore('appStore'),
    storeProvider.getStore('mappingStore'),
    storeProvider.getStore('musicStore'),
    storeProvider.getStore('settingsStore'),
    storeProvider.getStore('taskStore'),
    storeProvider.getStore('githubStore')
  ]
  storeList.forEach((store) => cacheManager.registerStore(store))

  // Set up store listeners
  storeProvider.getStore('mappingStore').addListener('action', (action) => {
    action && sendIpcData({ type: 'action', payload: action })
  })
  storeProvider.getStore('mappingStore').addListener('key', (key) => {
    key && sendIpcData({ type: 'key', payload: key })
  })
  storeProvider.getStore('mappingStore').addListener('profile', (profile) => {
    profile && sendIpcData({ type: 'profile', payload: profile })
  })

  storeProvider.getStore('connectionsStore').on((clients: Client[]) => {
    sendIpcData({
      type: 'connections',
      payload: { status: true, data: clients.length, final: true }
    })
    sendIpcData({
      type: 'clients',
      payload: { status: true, data: clients, final: true }
    })
  })

  storeProvider.getStore('connectionsStore').onDevice((devices: ADBClient[]) => {
    sendIpcData({
      type: 'adbdevices',
      payload: devices
    })
  })

  storeProvider.getStore('appDataStore').on('settings', (data) => {
    Logger.debug('[INDEX]: Sending updated setting information with type app-data')

    sendIpcData({
      type: 'app-settings',
      payload: data as { appId: string; data: AppSettings }
    })
  })

  storeProvider.getStore('appStore').on('apps', ({ data }) => {
    Logger.debug('[INDEX]: Sending updated app information with type app-data')
    sendIpcData({
      type: 'app-data',
      payload: data
    })
  })

  storeProvider.getStore('taskStore').on('taskList', (taskList) => {
    sendIpcData({
      type: 'taskList',
      payload: taskList
    })
  })

  storeProvider.getStore('githubStore').on('app', (app) => {
    Logger.debug('[INDEX]: Sending updated app information with type github-apps')
    sendIpcData({
      type: 'github-apps',
      payload: app
    })
  })
  storeProvider.getStore('githubStore').on('client', (client) => {
    Logger.debug('[INDEX]: Sending updated client information with type github-client')
    sendIpcData({
      type: 'github-client',
      payload: client
    })
  })
  storeProvider.getStore('githubStore').on('community', (community) => {
    Logger.debug('[INDEX]: Sending updated community information with type github-community')
    sendIpcData({
      type: 'github-community',
      payload: community
    })
  })

  storeProvider.getStore('settingsStore').addListener((newSettings) => {
    sendIpcData({
      type: 'settings-updated',
      payload: newSettings
    })
  })

  storeProvider.getStore('appStore').onAppMessage(SEND_TYPES.OPEN, (data) => {
    if (typeof data.payload == 'string') {
      shell.openExternal(data.payload)
    } else {
      Logger.warn('App sent invalid payload for openAuthWindow', {
        source: 'appCommunication',
        function: 'handleRequestOpen',
        domain: data.source
      })
    }
  })

  storeProvider.getStore('appStore').onAppMessage(SEND_TYPES.LOG, (data) => {
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

  storeProvider.getStore('appStore').onAppMessage(
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
          const appStore = storeProvider.getStore('appStore')
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

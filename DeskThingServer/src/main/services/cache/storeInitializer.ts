import { ADBClient, Client } from '@shared/types'
import { sendIpcData } from '../../index'
import Logger from '../../utils/logger'

export async function initializeStores(): Promise<void> {
  const { default: cacheManager } = await import('./cacheManager')
  const stores = await import('../../stores')

  // Register stores for cache management
  const storeList = [
    stores.connectionStore,
    stores.appStore,
    stores.mappingStore,
    stores.musicStore,
    stores.settingsStore,
    stores.taskStore,
    stores.githubStore
  ]
  storeList.forEach((store) => cacheManager.registerStore(store))

  // Set up store listeners
  stores.mappingStore.addListener('action', (action) => {
    action && sendIpcData({ type: 'action', payload: action })
  })
  stores.mappingStore.addListener('key', (key) => {
    key && sendIpcData({ type: 'key', payload: key })
  })
  stores.mappingStore.addListener('profile', (profile) => {
    profile && sendIpcData({ type: 'profile', payload: profile })
  })

  stores.connectionStore.on((clients: Client[]) => {
    sendIpcData({
      type: 'connections',
      payload: { status: true, data: clients.length, final: true }
    })
    sendIpcData({
      type: 'clients',
      payload: { status: true, data: clients, final: true }
    })
  })

  stores.connectionStore.onDevice((devices: ADBClient[]) => {
    sendIpcData({
      type: 'adbdevices',
      payload: devices
    })
  })

  stores.appStore.on('settings', (data) => {
    Logger.debug('[INDEX]: Sending updated setting information with type app-data')
    sendIpcData({
      type: 'app-settings',
      payload: data
    })
  })

  stores.appStore.on('apps', ({ data }) => {
    Logger.debug('[INDEX]: Sending updated app information with type app-data')
    sendIpcData({
      type: 'app-data',
      payload: data
    })
  })

  stores.taskStore.on('taskList', (taskList) => {
    sendIpcData({
      type: 'taskList',
      payload: taskList
    })
  })

  stores.githubStore.on('app', (app) => {
    Logger.debug('[INDEX]: Sending updated app information with type github-apps')
    sendIpcData({
      type: 'github-apps',
      payload: app
    })
  })
  stores.githubStore.on('client', (client) => {
    Logger.debug('[INDEX]: Sending updated client information with type github-client')
    sendIpcData({
      type: 'github-client',
      payload: client
    })
  })
  stores.githubStore.on('community', (community) => {
    Logger.debug('[INDEX]: Sending updated community information with type github-community')
    sendIpcData({
      type: 'github-community',
      payload: community
    })
  })

  stores.settingsStore.addListener((newSettings) => {
    sendIpcData({
      type: 'settings-updated',
      payload: newSettings
    })
  })
}

import { storeProvider } from '@server/stores/storeProvider'
import { SocketData, ClientManifest, SettingsType } from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { Client } from '@shared/types'
import { PlatformInterface } from '@shared/interfaces/platform'

const alwaysAllow = ['preferences', 'ping', 'pong', 'manifest']
const messageThrottles = new Map()
const THROTTLE_DELAY = 300

export async function handlePlatformMessage(
  platform: PlatformInterface,
  client: Client,
  messageData: SocketData
): Promise<void> {
  const messageKey = `${messageData.app}-${messageData.type}-${messageData.request}`
  const now = Date.now()

  if (
    !messageThrottles.has(messageKey) ||
    now - messageThrottles.get(messageKey) > THROTTLE_DELAY ||
    alwaysAllow.includes(messageData.type)
  ) {
    messageThrottles.set(messageKey, now)

    try {
      if (messageData.app === 'server') {
        await handleServerMessage(platform, client, messageData)
      } else if (messageData.app === 'utility' || messageData.app === 'music') {
        const musicStore = await storeProvider.getStore('musicStore')
        await musicStore.handleClientRequest(messageData)
      } else if (messageData.app) {
        const appStore = await storeProvider.getStore('appStore')

        await appStore.sendDataToApp(messageData.app.toLowerCase(), {
          type: messageData.type,
          request: messageData.request,
          payload: messageData.payload
        })
      }

      // Cleanup throttle
      messageThrottles.forEach((timestamp, key) => {
        if (now - timestamp > THROTTLE_DELAY) {
          messageThrottles.delete(key)
        }
      })
    } catch (error) {
      Logger.error('Error handling platform message', {
        error: error as Error,
        domain: client.connectionId,
        source: 'platformMessage'
      })
    }
  }
}

async function handleServerMessage(
  platform: PlatformInterface,
  client: Client,
  messageData: SocketData
): Promise<void> {
  const appStore = await storeProvider.getStore('appStore')
  const appDataStore = await storeProvider.getStore('appDataStore')
  const mappingStore = await storeProvider.getStore('mappingStore')
  const settingsStore = await storeProvider.getStore('settingsStore')

  switch (messageData.type) {
    case 'heartbeat':
      await platform.sendData(client.connectionId, {
        type: 'heartbeat',
        app: 'client',
        payload: new Date().toISOString()
      })
      break

    case 'ping':
      await platform.sendData(client.connectionId, {
        type: 'pong',
        app: 'client',
        payload: new Date().toISOString()
      })
      break

    case 'set':
      if (messageData.request === 'update_pref_index' && messageData.payload) {
        const { app: appName, index: newIndex } = messageData.payload as {
          app: string
          index: number
        }
        await appStore.setItemOrder(appName, newIndex)
      } else if (messageData.request === 'settings' && messageData.payload) {
        const { app, id, setting } = messageData.payload as {
          app: string
          id: string
          setting: SettingsType
        }
        await appDataStore.addSetting(app, id, setting)
      }
      break

    case 'get': {
      const settings = await settingsStore.getSettings()
      const mapping = await mappingStore.getMapping()
      const actions = await mappingStore.getActions()
      const apps = await appStore.getAll()

      await platform.sendData(client.connectionId, {
        type: 'settings',
        app: 'client',
        payload: settings
      })

      await platform.sendData(client.connectionId, {
        type: 'button_mappings',
        app: 'client',
        payload: { ...mapping, actions }
      })

      await platform.sendData(client.connectionId, {
        type: 'config',
        app: 'client',
        payload: apps.filter((app) => app.manifest?.isWebApp !== false)
      })
      break
    }
    case 'manifest':
      if (messageData.payload) {
        const manifest = messageData.payload as ClientManifest & { adbId: string }
        const clientUpdates: Partial<Client> = {
          connected: true,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description
        }

        if (manifest.adbId) {
          clientUpdates.adbId = manifest.adbId
          clientUpdates.device_type = manifest.device_type
        }

        const platformStore = await storeProvider.getStore('platformStore')
        platformStore.updateClient(client.connectionId, clientUpdates)

        Logger.info(`Updated client manifest for ${client.connectionId}`, {
          domain: client.connectionId,
          source: 'platformMessage',
          function: 'updateClient'
        })
      }

      break

    case 'action':
      await mappingStore.runAction(messageData.payload)
      break

    default:
      break
  }
}

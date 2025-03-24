import { storeProvider } from '@server/stores/storeProvider'
import {
  ClientManifest,
  DESKTHING_DEVICE,
  Client,
  DeviceToDeskthingData,
  DEVICE_DESKTHING,
  DESKTHING_EVENTS,
  DeskThingToAppCore
} from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { PlatformInterface } from '@shared/interfaces/platform'

const alwaysAllow = ['preferences', 'ping', 'pong', 'manifest']
const messageThrottles = new Map()
const THROTTLE_DELAY = 300

export async function handlePlatformMessage(
  platform: PlatformInterface,
  client: Client,
  messageData: DeviceToDeskthingData & { connectionId: string }
): Promise<void> {
  const messageKey = `${messageData.app}-${messageData.type}-${messageData['request']}`
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
        // musicStore now listens directly
        // const musicStore = await storeProvider.getStore('musicStore')
        // await musicStore.handleClientRequest(messageData)
      } else if (messageData.type == DEVICE_DESKTHING.SETTINGS) {
        const appDataStore = await storeProvider.getStore('appDataStore')
        if (messageData.request == 'set') {
          await appDataStore.addSettings(messageData.app, messageData.payload)
        } else if (messageData.request == 'update') {
          await appDataStore.updateSetting(
            messageData.app,
            messageData.payload.id,
            messageData.payload.value
          )
        }
      } else if (messageData.type === DEVICE_DESKTHING.APP_PAYLOAD && messageData.payload) {
        const appStore = await storeProvider.getStore('appStore')

        await appStore.sendDataToApp(messageData.app.toLowerCase(), {
          ...messageData.payload,
          clientId: messageData.connectionId
        } as DeskThingToAppCore)
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
  messageData: DeviceToDeskthingData
): Promise<void> {
  const appStore = await storeProvider.getStore('appStore')
  const mappingStore = await storeProvider.getStore('mappingStore')

  switch (messageData.type) {
    case DEVICE_DESKTHING.PING:
      await platform.sendData(client.connectionId, {
        type: DESKTHING_DEVICE.PONG,
        app: 'client',
        payload: new Date().toISOString()
      })
      break

    case DEVICE_DESKTHING.SET:
      if (messageData.request === 'update_pref_index' && messageData.payload) {
        const { app: appName, index: newIndex } = messageData.payload as {
          app: string
          index: number
        }
        await appStore.setItemOrder(appName, newIndex)
      }
      break
    case DEVICE_DESKTHING.VIEW:
      if (messageData.request == 'change') {
        const { currentApp, previousApp } = messageData.payload
        // Update the apps with what page is currently open
        await appStore.sendDataToApp(currentApp, {
          type: DESKTHING_EVENTS.CLIENT_STATUS,
          request: 'opened',
          payload: client
        })
        await appStore.sendDataToApp(previousApp, {
          type: DESKTHING_EVENTS.CLIENT_STATUS,
          request: 'closed',
          payload: client
        })
        const connectionStore = await storeProvider.getStore('connectionsStore')
        connectionStore.updateClient(client.connectionId, {
          currentApp: currentApp
        })
      }
      break
    case DEVICE_DESKTHING.MANIFEST:
      if (messageData.payload) {
        const manifest = messageData.payload as ClientManifest
        const clientUpdates: Partial<Client> = {
          connected: true,
          manifest: {
            ...manifest
          }
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

    case DEVICE_DESKTHING.ACTION:
      await mappingStore.runAction(messageData.payload)
      break

    default:
      break
  }
}

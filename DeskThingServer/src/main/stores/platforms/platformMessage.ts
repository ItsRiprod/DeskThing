import { storeProvider } from '@server/stores/storeProvider'
import {
  ClientManifest,
  DESKTHING_DEVICE,
  Client,
  DeviceToDeskthingData,
  DEVICE_DESKTHING,
  DESKTHING_EVENTS,
  DeskThingToAppCore,
  LOGGING_LEVELS
} from '@deskthing/types'
import Logger from '@server/utils/logger'
import { PlatformInterface } from '@shared/interfaces/platformInterface'

export async function handlePlatformMessage(
  platform: PlatformInterface,
  client: Client,
  messageData: DeviceToDeskthingData & { clientId: string }
): Promise<void> {
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
        clientId: messageData.clientId
      } as DeskThingToAppCore)
    }
  } catch (error) {
    Logger.error('Error handling platform message', {
      error: error as Error,
      domain: client.clientId,
      source: 'platformMessage'
    })
  }
}

async function handleServerMessage(
  platform: PlatformInterface,
  client: Client,
  messageData: DeviceToDeskthingData
): Promise<void> {
  const appStore = await storeProvider.getStore('appStore')
  const mappingStore = await storeProvider.getStore('mappingStore')

  const debug = Logger.createLogger(LOGGING_LEVELS.DEBUG, {
    function: 'HandleServerMessage',
    source: 'platformMessage'
  })
  
  switch (messageData.type) {
    case DEVICE_DESKTHING.PING:
      await platform.sendData(client.clientId, {
        type: DESKTHING_DEVICE.PONG,
        app: 'client',
        payload: client.clientId
      })
      break
      
    case DEVICE_DESKTHING.SET:
      debug(`Handling ${messageData.type} from ${client.clientId} request: ${messageData.request}`)
      if (messageData.request === 'update_pref_index' && messageData.payload) {
        const { app: appName, index: newIndex } = messageData.payload as {
          app: string
          index: number
        }
        await appStore.setItemOrder(appName, newIndex)
      }
      break
    case DEVICE_DESKTHING.GET:
      debug(`Handling ${messageData.type} from ${client.clientId} request: ${messageData.request}`)
      if (messageData.request === 'initialData') {
        const platformStore = await storeProvider.getStore('platformStore')
        await platformStore.sendInitialDataToClient(client.clientId)
      }
      break
    case DEVICE_DESKTHING.VIEW:
      debug(`Handling ${messageData.type} from ${client.clientId} request: ${messageData.request}`)
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
        // const connectionStore = await storeProvider.getStore('connectionsStore')
        // connectionStore.updateClient(client.clientId, {
        //   currentApp: currentApp
        // })
      }
      break
    case DEVICE_DESKTHING.MANIFEST:
      debug(`Handling MANIFEST request from ${client.clientId} to set the manifest`)
      if (messageData.payload) {
        const manifest = messageData.payload as ClientManifest
        const clientUpdates: Partial<Client> = {
          connected: true,
          manifest: {
            ...manifest
          }
        }

        const platformStore = await storeProvider.getStore('platformStore')
        platformStore.updateClient(client.clientId, clientUpdates)

        Logger.info(`Updated client manifest for ${client.clientId}`, {
          domain: client.clientId,
          source: 'platformMessage',
          function: 'updateClient'
        })
      }

      break

    case DEVICE_DESKTHING.ACTION:
      debug(`Handling ${messageData.type} from ${client.clientId} request: ${messageData.request}`)
      await mappingStore.runAction(messageData.payload)
      break

    case DEVICE_DESKTHING.LOG:
      {
        const log = messageData.payload
        Logger.log(log.level, log.message, { ...log, domain: client.clientId })
      }
      break

    default:
      break
  }
}

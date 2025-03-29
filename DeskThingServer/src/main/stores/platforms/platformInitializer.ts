import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'
import { WebSocketPlatform } from './websocket/wsPlatform'
import { ADBPlatform } from './superbird/adbPlatform'

export async function initializePlatforms(): Promise<void> {
  try {
    const platformStore = await storeProvider.getStore('platformStore')

    // Initialize WebSocket platform
    const wsPlatform = new WebSocketPlatform()
    const adbPlatform = new ADBPlatform()
    await platformStore.registerPlatform(wsPlatform)
    await platformStore.registerPlatform(adbPlatform)

    // Start the ws platform
    await platformStore.startPlatform(wsPlatform.id, {
      port: 8891,
      address: '0.0.0.0'
    })

    await platformStore.startPlatform(adbPlatform.id, {
      autoDetect: true
    })

    Logger.debug('Platforms initialized successfully', {
      source: 'platformInitializer',
      function: 'initializePlatforms'
    })
  } catch (error) {
    Logger.error('Failed to initialize platforms', {
      source: 'platformInitializer',
      function: 'initializePlatforms',
      error: error instanceof Error ? error : new Error(String(error))
    })
  }
}

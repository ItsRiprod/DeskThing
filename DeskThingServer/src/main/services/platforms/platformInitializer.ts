import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'
import { WebSocketPlatform } from './websocket/wsPlatform'

export async function initializePlatforms(): Promise<void> {
  try {
    const platformStore = storeProvider.getStore('platformStore')

    // Initialize WebSocket platform
    const wsPlatform = new WebSocketPlatform()
    await platformStore.addPlatform(wsPlatform)

    // Start the ws platform
    await platformStore.startPlatform(wsPlatform.id)

    Logger.info('Platforms initialized successfully', {
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

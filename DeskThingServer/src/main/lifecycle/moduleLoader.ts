/**
 * Handles loading and initialization of application modules
 */
import { updateLoadingStatus } from '../windows/loadingWindow'

/**
 * Loads and initializes all required modules
 */
export async function loadModules(): Promise<void> {
  try {
    updateLoadingStatus('Initializing stores...')
    const { initializeStores } = await import('../services/cache/storeInitializer')
    await initializeStores()

    updateLoadingStatus('Initializing platforms...')
    const { initializePlatforms } = await import('../stores/platforms/platformInitializer')
    await initializePlatforms()

    updateLoadingStatus('Setup complete!')
    return Promise.resolve()
  } catch (error) {
    console.error('Error loading modules: ', error)
    return Promise.reject(error)
  }
}

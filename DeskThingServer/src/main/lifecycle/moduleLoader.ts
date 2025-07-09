/**
 * Handles loading and initialization of application modules
 */
import { updateLoadingStatus } from '../windows/loadingWindow'
import '@server/system/process' // handles process errors 
/**
 * Loads and initializes all required modules
 */
export async function loadModules(): Promise<void> {
  try {
    updateLoadingStatus('Initializing stores...')
    const { initializeStores } = await import('../services/utility/storeInitializer')
    await initializeStores()

    updateLoadingStatus('Initializing platforms...')
    const { initializePlatforms } = await import('../stores/platforms/platformInitializer')
    await initializePlatforms()
    return
  } catch (error) {
    console.error('Error loading modules: ', error)
    return
  }
}

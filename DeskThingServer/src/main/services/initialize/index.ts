/**
 * the initialization process. This is meant to be as fast as possible and run while the app is starting up before any core functions run
 *
 * Things like clearing/creating file systems and initial system check
 */
import { updateLoadingStatus } from '@server/windows/loadingWindow'
import { getCurrentVersion } from './getVersion'
import { migrateDeskThing } from './migrateDeskThing'

export const initializationCheck = async (): Promise<void> => {
  // Check the current version (if it exists)
  try {
    const currentVersion = await getCurrentVersion()
    
    // Migrate the fs to the current version
    await migrateDeskThing(currentVersion)
    
    await updateLoadingStatus('Finalizing...')
  } catch (error) {
    console.error('An error was found while initializing - skipping', error)
  }
}

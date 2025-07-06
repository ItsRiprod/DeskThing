import { LOGGING_LEVELS } from '@deskthing/types'
import { storeProvider } from '@server/stores/storeProvider'
import logger from '@server/utils/logger'

/**
 * These are tasks that need to run eventually after the server starts - but not with any haste
 */
export const afterStartTasks = async (): Promise<void> => {
  const log = logger.createLogger(LOGGING_LEVELS.LOG, {
    function: 'AfterTasks',
    domain: 'AfterStartupTasks'
  })
  const debug = logger.createLogger(LOGGING_LEVELS.DEBUG, {
    function: 'AfterTasks',
    domain: 'AfterStartupTasks'
  })

  debug('Initializing the after log tasks')

  const releaseStore = await storeProvider.getStore('releaseStore')

  // automatically refresh data
  debug('Refreshing data...')
  await releaseStore.refreshData()

  debug('Checking for update...')
  const updateStore = await storeProvider.getStore('updateStore')
  await updateStore.checkForUpdates()

  log('Finished running post-run tasks')
}

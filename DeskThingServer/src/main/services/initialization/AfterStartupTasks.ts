import { storeProvider } from '@server/stores/storeProvider'
import logger from '@server/utils/logger'

/**
 * These are tasks that need to run eventually after the server starts - but not with any haste
 */
export const afterStartTasks = async (): Promise<void> => {
  const { log, debug } = logger.createLogger({
    store: 'AfterTasks',
    method: 'AfterStartupTasks'
  })

  debug('Initializing the after log tasks')

  const releaseStore = await storeProvider.getStore('releaseStore')

  // automatically refresh data
  debug('Refreshing data...')
  await releaseStore.refreshData()

  debug('Checking for update...')
  const updateStore = await storeProvider.getStore('updateStore')
  await updateStore.checkForUpdates()

  // check for server-notifications
  debug('Checking for server notifications...')
  const notificationStore = await storeProvider.getStore('notificationStore')
  await notificationStore.checkForNotifications()

  debug('Setting up time store...')
  const timeStore = await storeProvider.getStore('timeStore')
  await timeStore.initialize()

  log('Finished running post-run tasks')
}

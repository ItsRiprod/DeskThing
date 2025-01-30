import { MESSAGE_TYPES, UpdateInfoType, UpdateProgressType } from '@shared/types'
import electronUpdater, { type AppUpdater } from 'electron-updater'
import { notifyUpdateFinished, notifyUpdateStatus } from './updateUtils'
import { sendIpcData } from '@server/index'

let configuredUpdater: AppUpdater | null = null

export function getAutoUpdater(): AppUpdater {
  // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
  // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
  const { autoUpdater } = electronUpdater

  if (configuredUpdater) {
    return configuredUpdater
  }

  import('@server/utils/logger').then(({ default: Logger }) => {
    autoUpdater.logger = {
      info: (message): Promise<void> => Logger.info(message, { source: 'AutoUpdater' }),
      warn: (message): Promise<void> => Logger.warn(message, { source: 'AutoUpdater' }),
      error: (message): Promise<void> => Logger.error(message, { source: 'AutoUpdater' }),
      debug: (message): Promise<void> => Logger.debug(message, { source: 'AutoUpdater' })
    }

    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download progress: ${progressObj.percent}%`
      if (progressObj.bytesPerSecond) {
        logMessage += ` - ${progressObj.bytesPerSecond} bytes/sec`
      }
      if (progressObj.total) {
        logMessage += ` - ${progressObj.transferred}/${progressObj.total}`
      }
      Logger.log(MESSAGE_TYPES.LOGGING, logMessage)

      const progress: UpdateProgressType = {
        percent: progressObj.percent,
        speed: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      }

      sendIpcData({ type: 'update-progress', payload: progress })
    })

    autoUpdater.on('update-downloaded', (info) => {
      // Prompt the user to quit and install the update
      Logger.log(MESSAGE_TYPES.DEBUG, 'Update downloaded: ' + JSON.stringify(info))
      notifyUpdateFinished(info)
    })
  })

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    // autoUpdater.allowPrerelease = true
    // autoUpdater.forceDevUpdateConfig = true
    // autoUpdater.disableWebInstaller = true
    // autoUpdater.autoDownload = false
    // autoUpdater.autoInstallOnAppQuit = false
    // autoUpdater.updateConfigPath = 'dev-app-update.yml'
    // autoUpdater.requestHeaders = {
    //   'Cache-Control': 'no-cache'
    // }
    // autoUpdater.setFeedURL({
    //   provider: 'github',
    //   owner: 'ItsRiprod',
    //   repo: 'DeskThing',
    //   private: false,
    //   channel: 'dev'
    // })
  } else {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'ItsRiprod',
      repo: 'DeskThing',
      private: false
    })
  }

  configuredUpdater = autoUpdater

  return configuredUpdater
}

export const checkForUpdates = async (): Promise<void> => {
  const autoUpdater = getAutoUpdater()

  autoUpdater.checkForUpdatesAndNotify().then((downloadNotification) => {
    return notifyUpdateStatus(downloadNotification)
  })
}

export const startDownload = async (): Promise<void> => {
  const autoUpdater = getAutoUpdater()
  const updateCheck = await autoUpdater.checkForUpdates()
  if (updateCheck) {
    try {
      const result = await autoUpdater.downloadUpdate()
      console.log('[autoUpdater]: Downloaded update successfully with result:', result)
    } catch (error) {
      if (error instanceof Error) {
        const errorStatus: UpdateInfoType = {
          updateAvailable: true,
          updateDownloaded: false,
          failed: true,
          error: error.message
        }
        sendIpcData({ type: 'update-status', payload: errorStatus })
        console.log('[autoUpdater]: Encountered an error: ', error.message)
      } else {
        const errorStatus: UpdateInfoType = {
          updateAvailable: true,
          updateDownloaded: false,
          failed: true,
          error: 'Unknown Error'
        }
        sendIpcData({ type: 'update-status', payload: errorStatus })
        console.error('[autoUpdater]: Unknown error')
      }
    }
  }
}

export const quitAndInstall = (): void => {
  const autoUpdater = getAutoUpdater()
  autoUpdater.quitAndInstall()
}

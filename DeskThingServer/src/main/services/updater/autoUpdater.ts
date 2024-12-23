import { loggingStore } from '@server/stores'
import electronUpdater, { UpdateCheckResult, type AppUpdater } from 'electron-updater'

/**
 * Retrieves the Electron auto-updater instance.
 * @returns {AppUpdater} The Electron auto-updater instance.
 */
export function getAutoUpdater(): AppUpdater {
  // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
  // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
  const { autoUpdater } = electronUpdater

  return autoUpdater
}

export const checkForUpdates = async (
  autoUpdater?: electronUpdater.AppUpdater
): Promise<UpdateCheckResult | null> => {
  if (!autoUpdater) {
    autoUpdater = getAutoUpdater()
  }

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    autoUpdater.allowPrerelease = true
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.logger = loggingStore

  autoUpdater.autoDownload = false

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'ItsRiprod',
    repo: 'DeskThing',
    private: false
  })

  autoUpdater.on('update-downloaded', (info) => {
    // Prompt the user to quit and install the update
    console.log(info)
  })

  const downloadNotification = await autoUpdater.checkForUpdatesAndNotify()

  return downloadNotification
}

export const notifyOfUpdate = async (
  downloadNotification?: electronUpdater.UpdateCheckResult
): Promise<void> => {
  if (!downloadNotification) {
    return
  }
}

export const startDownload = (): void => {
  const autoUpdater = getAutoUpdater()
  autoUpdater.downloadUpdate()
}

export const quitAndInstall = (): void => {
  const autoUpdater = getAutoUpdater()
  autoUpdater.quitAndInstall()
}

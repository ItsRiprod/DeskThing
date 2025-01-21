import { sendIpcData } from '@server/index'
import { loggingStore } from '@server/stores'
import { MESSAGE_TYPES, UpdateInfoType } from '@shared/types'
import { UpdateCheckResult, UpdateDownloadedEvent } from 'electron-updater'

export const notifyUpdateStatus = async (
  downloadNotification: UpdateCheckResult | null
): Promise<void> => {
  if (downloadNotification) {
    // Handle the update notification
    const updateInfo: UpdateInfoType = {
      updateAvailable: true,
      updateDownloaded: false,
      version: downloadNotification.updateInfo.version,
      releaseNotes: downloadNotification.updateInfo.releaseNotes as string,
      releaseName: downloadNotification.updateInfo.releaseName,
      releaseDate: downloadNotification.updateInfo.releaseDate
    }
    loggingStore.log(MESSAGE_TYPES.DEBUG, 'Update notification: ' + downloadNotification)
    sendIpcData({ type: 'update-status', payload: updateInfo })
  } else {
    const updateInfo: UpdateInfoType = {
      updateAvailable: false,
      updateDownloaded: false
    }
    sendIpcData({ type: 'update-status', payload: updateInfo })
    loggingStore.log(MESSAGE_TYPES.DEBUG, 'No update available')
  }
}

export const notifyUpdateFinished = async (
  downloadedNotification: UpdateDownloadedEvent
): Promise<void> => {
  const updateInfo: UpdateInfoType = {
    updateAvailable: true,
    updateDownloaded: true,
    version: downloadedNotification.version,
    releaseNotes: downloadedNotification.releaseNotes as string,
    releaseName: downloadedNotification.releaseName,
    releaseDate: downloadedNotification.releaseDate
  }
  sendIpcData({ type: 'update-status', payload: updateInfo })
  loggingStore.log(MESSAGE_TYPES.DEBUG, 'Update finished')
}

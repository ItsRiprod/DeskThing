import { UpdateStoreClass, UpdateStoreEvents } from '@shared/stores/updateStore'
import { CacheableStore, UpdateInfoType, UpdateProgressType } from '@shared/types'
import EventEmitter from 'node:events'
import electronUpdater, { type AppUpdater } from 'electron-updater'
import Logger from '@server/utils/logger'
import { LOGGING_LEVELS } from '@deskthing/types'
import { handleError } from '@server/utils/errorHandler'

export class UpdateStore
  extends EventEmitter<UpdateStoreEvents>
  implements CacheableStore, UpdateStoreClass
{
  private _initialized = false
  private _updateStatus: UpdateInfoType | null = null
  private _updateProgress: UpdateProgressType | null = null
  private _autoUpdater: AppUpdater | null = null

  get initialized(): boolean {
    return this._initialized
  }

  constructor() {
    super()

    // Defer initializing for a couple of seconds
    setTimeout(this.initialize, 5000)
  }

  clearCache: () => Promise<void> = async () => {}
  saveToFile: () => Promise<void> = async () => {}

  initialize = async (): Promise<void> => {
    if (this._initialized) return

    Logger.debug('Initializing update store', {
      source: 'UpdateStore',
      function: 'initialize'
    })

    const { autoUpdater } = electronUpdater
    this._autoUpdater = autoUpdater

    this._autoUpdater.logger = {
      info: (message): Promise<void> => Logger.info(message, { source: 'AutoUpdater' }),
      warn: (message): Promise<void> => Logger.warn(message, { source: 'AutoUpdater' }),
      error: (message): Promise<void> => Logger.error(message, { source: 'AutoUpdater' }),
      debug: (message): Promise<void> => Logger.debug(message, { source: 'AutoUpdater' })
    }

    this._autoUpdater.on('download-progress', (progressObj) => {
      const progress: UpdateProgressType = {
        percent: progressObj.percent,
        speed: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      }
      this.setUpdateProgress(progress)

      Logger.log(
        LOGGING_LEVELS.LOG,
        `Download progress: ${progress.percent}% - ${progress.speed} bytes/sec - ${progress.transferred}/${progress.total}`
      )
    })

    this._autoUpdater.on('update-downloaded', (info) => {
      Logger.log(LOGGING_LEVELS.LOG, 'Update downloaded: ' + JSON.stringify(info))
      const updateInfo: UpdateInfoType = {
        updateAvailable: true,
        updateDownloaded: true,
        version: info.version,
        releaseNotes: info.releaseNotes as string,
        releaseName: info.releaseName,
        releaseDate: info.releaseDate
      }
      this.setUpdateStatus(updateInfo)
    })

    this._autoUpdater.on('error', (error) => {
      const errorStatus: UpdateInfoType = {
        updateAvailable: false,
        updateDownloaded: false,
        failed: true,
        error: error.message
      }
      this.setUpdateStatus(errorStatus)
      this.emit('update-error', error.message)
    })

    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      this._autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'ItsRiprod',
        repo: 'DeskThing',
        private: false
      })
    }

    this._initialized = true
  }

  checkForUpdates = async (): Promise<string> => {
    if (!this._autoUpdater) return 'AutoUpdater not initialized'

    try {
      const downloadNotification = await this._autoUpdater.checkForUpdatesAndNotify()
      if (
        downloadNotification &&
        process.env.PACKAGE_VERSION != downloadNotification.updateInfo.version
      ) {
        const updateInfo: UpdateInfoType = {
          updateAvailable: true,
          updateDownloaded: false,
          version: downloadNotification.updateInfo.version,
          releaseNotes: downloadNotification.updateInfo.releaseNotes as string,
          releaseName: downloadNotification.updateInfo.releaseName,
          releaseDate: downloadNotification.updateInfo.releaseDate
        }
        this.setUpdateStatus(updateInfo)
        return 'Update available'
      } else {
        const updateInfo: UpdateInfoType = {
          updateAvailable: false,
          updateDownloaded: false
        }
        this.setUpdateStatus(updateInfo)
        return 'No update available'
      }
    } catch (error) {
      const errorMessage = handleError(error)
      const errorStatus: UpdateInfoType = {
        updateAvailable: false,
        updateDownloaded: false,
        failed: true,
        error: errorMessage
      }
      this.setUpdateStatus(errorStatus)
      this.emit('update-error', errorMessage)
      return errorMessage
    }
  }

  startDownload = async (): Promise<void> => {
    if (!this._autoUpdater) return

    try {
      const updateCheck = await this._autoUpdater.checkForUpdates()
      if (updateCheck) {
        await this._autoUpdater.downloadUpdate()
      }
    } catch (error) {
      const errorMessage = handleError(error)
      const errorStatus: UpdateInfoType = {
        updateAvailable: true,
        updateDownloaded: false,
        failed: true,
        error: errorMessage
      }
      this.setUpdateStatus(errorStatus)
      this.emit('update-error', errorMessage)
    }
  }

  quitAndInstall = (): void => {
    if (!this._autoUpdater) return
    this._autoUpdater.quitAndInstall()
  }

  getUpdateStatus = (): UpdateInfoType | null => {
    return this._updateStatus
  }

  getUpdateProgress = (): UpdateProgressType | null => {
    return this._updateProgress
  }

  setUpdateStatus = (status: UpdateInfoType): void => {
    this._updateStatus = status
    this.emit('update-status', status)
  }

  setUpdateProgress = (progress: UpdateProgressType): void => {
    this._updateProgress = progress
    this.emit('update-progress', progress)
  }
}

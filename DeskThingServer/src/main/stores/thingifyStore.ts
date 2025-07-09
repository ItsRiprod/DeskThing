import {
  CacheableStore,
  ProgressChannel,
  ProgressStatus,
  ThingifyApiFirmware,
  ThingifyApiVersion,
  ThingifyArchiveDownloadEvent,
  ThingifyArchiveDownloadResult
} from '@shared/types'
import EventEmitter from 'node:events'
import { ThingifyStoreClass, ThingifyStoreEvents } from '@shared/stores/thingifyStore'
import { app } from 'electron/main'
import { basename, dirname, join } from 'node:path'
import { handleError } from '@server/utils/errorHandler'
import { access, copyFile, mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import logger from '@server/utils/logger'
import { existsSync } from 'node:fs'
import { progressBus } from '@server/services/events/progressBus'

export class ThingifyStore
  extends EventEmitter<ThingifyStoreEvents>
  implements CacheableStore, ThingifyStoreClass
{
  private readonly _base_url: string = 'https://thingify.tools/api/v1'
  private readonly _thinglabs_id: string = 'P3QZbZIDWnp5m_azQFQqP'
  private readonly _fallback_firmware_url: string =
    'https://github.com/ItsRiprod/DeskThing-Firmwares/releases/download/v8.9.2/8.9.2-thinglabs_norndis.zip'
  private readonly downloadLocation: string

  // cache
  private thingifyFirmwareCache: ThingifyApiFirmware | null = null
  private thingifyVersionsCache: Record<string, ThingifyApiVersion> = {}

  private stagedFileName: string = ''

  private _initialized: boolean = false

  public get initialized(): boolean {
    return this._initialized
  }

  constructor() {
    super()
    this.downloadLocation = join(app.getPath('userData'), 'flash')
  }

  async initialize(): Promise<void> {
    await logger.info('Initializing ThingifyStore', {
      source: 'ThingifyStore',
      function: 'initialize'
    })
    if (this._initialized) return
    this._initialized = true
  }

  public clearCache = async (): Promise<void> => {
    await logger.info('Clearing cache', { source: 'ThingifyStore', function: 'clearCache' })
    this.thingifyFirmwareCache = null
    this.thingifyVersionsCache = {}
  }

  public saveToFile = async (): Promise<void> => {
    await logger.debug('No persistent data to save', {
      source: 'ThingifyStore',
      function: 'saveToFile'
    })
  }

  private setStagedFile = (fileName: string): void => {
    this.emit('stagedFileChange', fileName)
    logger.debug(`Setting staged file name from ${this.stagedFileName} to ${fileName}`, {
      source: 'ThingifyStore',
      function: 'setStagedFile'
    })
    this.stagedFileName = fileName
  }

  private fetchFirmware = async (): Promise<ThingifyApiFirmware | null> => {
    await logger.info('Fetching firmware', { source: 'ThingifyStore', function: 'fetchFirmware' })
    if (this.thingifyFirmwareCache) return this.thingifyFirmwareCache
    const response = await fetch(`${this._base_url}/firmware/${this._thinglabs_id}`)
    if (!response.ok) return null
    const data = await response.json()
    this.thingifyFirmwareCache = data
    return data
  }

  private fetchVersion = async (versionId: string): Promise<ThingifyApiVersion | null> => {
    await logger.info(`Fetching version ${versionId}`, {
      source: 'ThingifyStore',
      function: 'fetchVersion'
    })
    if (this.thingifyVersionsCache[versionId]) return this.thingifyVersionsCache[versionId]
    const response = await fetch(`${this._base_url}/version/${versionId}`)
    if (!response.ok) return null
    const data = await response.json()
    this.thingifyVersionsCache[versionId] = data
    return data
  }

  private downloadFile = async (versionId: string, fileId: string): Promise<void> => {
    await logger.info(`Downloading file ${fileId} for version ${versionId}`, {
      source: 'ThingifyStore',
      function: 'downloadFile'
    })
    let fileDownloadUrl: string | undefined
    let fileName: string
    try {
      const file = this.thingifyVersionsCache[versionId].files.find((file) => file.id == fileId)
      fileDownloadUrl = file?.downloadUrl
      fileName = file?.fileName || ''
    } catch (error) {
      await logger.error(`Error finding file ${fileId} in cache!`, {
        source: 'ThingifyStore',
        function: 'downloadFile',
        error: error as Error
      })
      throw new Error(`Error finding file ${fileId} in cache! ${handleError(error)}`)
    }

    if (!fileDownloadUrl) {
      await logger.error(`File ${fileName} not found in cache!`, {
        source: 'ThingifyStore',
        function: 'downloadFile'
      })
      throw new Error(`File ${fileName} not found in cache!`)
    }

    // might throw
    await this.download(fileDownloadUrl, fileName)
  }

  private download = async (fileDownloadUrl: string, fileName: string): Promise<void> => {
    const response = await fetch(fileDownloadUrl)
    if (!response.ok) {
      await logger.error(
        `Error downloading file ${fileName} with response ${response.status}: ${response.statusText}`,
        {
          source: 'ThingifyStore',
          function: 'downloadFile'
        }
      )
      throw new Error(
        `Error downloading file ${fileName}! Received ${response.status}: ${response.statusText}`
      )
    }

    const reader = response.body?.getReader()
    if (!reader) {
      await logger.error('Unable to read response', {
        source: 'ThingifyStore',
        function: 'downloadFile'
      })
      throw new Error('Unable to read response')
    }

    const contentLength = parseInt(response.headers.get('Content-Length') || '0')
    let receivedLength = 0
    const chunks: Uint8Array[] = []
    let lastProgress = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      receivedLength += value.length

      const progress = Math.floor((receivedLength / contentLength) * 100)
      if (progress >= lastProgress + 0.5) {
        this.emit('downloadProgress', {
          channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
          status: ProgressStatus.RUNNING,
          message: `${progress}% complete - ${(receivedLength / 1024 / 1024).toFixed(2)}MB of ${(contentLength / 1024 / 1024).toFixed(2)}MB`,
          operation: `Downloading ${fileName}`,
          progress: progress
        })
        await logger.debug(`Download progress: ${progress}%`, {
          source: 'ThingifyStore',
          function: 'downloadFile'
        })
        lastProgress = progress
      }
    }

    const allChunks = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    const filePath = join(this.downloadLocation, fileName)

    // create the file location recursively for unix systems
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, Buffer.from(allChunks))
    await logger.info(`File ${fileName} downloaded successfully`, {
      source: 'ThingifyStore',
      function: 'downloadFile'
    })

    this.emit('downloadProgress', {
      channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
      status: ProgressStatus.COMPLETE,
      message: `100% complete - ${(receivedLength / 1024 / 1024).toFixed(2)}MB of ${(contentLength / 1024 / 1024).toFixed(2)}MB`,
      operation: `Downloaded ${fileName} Successfully`,
      progress: 100
    })

    logger.debug(`Downloaded to ${filePath}`)
    this.setStagedFile(fileName)
  }

  private uploadFile = async (filePath: string): Promise<void> => {
    await logger.info(`Uploading file ${filePath}`, {
      source: 'ThingifyStore',
      function: 'uploadFile'
    })

    const fileName = basename(filePath)

    this.emit('downloadProgress', {
      channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
      status: ProgressStatus.RUNNING,
      message: `making directory`,
      operation: `Uploading ${fileName}`,
      progress: 0
    })

    const destinationPath = join(this.downloadLocation, fileName)

    await mkdir(dirname(destinationPath), { recursive: true })

    // Check if file exists and delete it
    try {
      const exists = await access(destinationPath)
        .then(() => true)
        .catch(() => false)
      if (exists) {
        this.emit('downloadProgress', {
          channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
          status: ProgressStatus.RUNNING,
          message: `removing existing file...`,
          operation: `Uploading ${fileName}`,
          progress: 25
        })
        await unlink(destinationPath)
      }
    } catch (error) {
      await logger.error(`Error checking/deleting existing file: ${error}`, {
        source: 'ThingifyStore',
        function: 'uploadFile'
      })
    }

    this.emit('downloadProgress', {
      channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
      status: ProgressStatus.RUNNING,
      message: `copying file...`,
      operation: `Uploading ${fileName}`,
      progress: 50
    })

    await copyFile(filePath, destinationPath)

    this.emit('downloadProgress', {
      channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
      status: ProgressStatus.COMPLETE,
      message: `File uploaded successfully`,
      operation: `Uploaded ${fileName}`,
      progress: 100
    })

    await logger.info(`File ${fileName} uploaded successfully`, {
      source: 'ThingifyStore',
      function: 'uploadFile'
    })
    logger.debug(`Copied to ${destinationPath}`)
    this.setStagedFile(fileName)
  }

  public getAvailableFirmware = async (): Promise<ThingifyApiFirmware | null> => {
    await logger.info('Getting available firmware', {
      source: 'ThingifyStore',
      function: 'getAvailableFirmware'
    })
    const firmware = await this.fetchFirmware()
    if (!firmware) {
      await logger.warn('No firmware available', {
        source: 'ThingifyStore',
        function: 'getAvailableFirmware'
      })
    }
    return firmware
  }

  public getAvailableFiles = async (versionId: string): Promise<ThingifyApiVersion | null> => {
    await logger.info(`Getting available files for version ${versionId}`, {
      source: 'ThingifyStore',
      function: 'getAvailableFiles'
    })
    const version = await this.fetchVersion(versionId)
    if (!version) {
      await logger.warn(`No files available for version ${versionId}`, {
        source: 'ThingifyStore',
        function: 'getAvailableFiles'
      })
    }
    return version
  }

  public startDownload = async (
    versionId: string,
    fileId: string
  ): Promise<ThingifyArchiveDownloadResult> => {
    await logger.info(`Starting download for file ${fileId} version ${versionId}`, {
      source: 'ThingifyStore',
      function: 'startDownload'
    })
    try {
      await this.downloadFile(versionId, fileId)

      await logger.info(`Download completed for file ${fileId}`, {
        source: 'ThingifyStore',
        function: 'startDownload'
      })
      return {
        status: true,
        statusText: 'Downloaded!',
        operationText: 'Download Success'
      }
    } catch (error) {
      await logger.error(`Download failed for file ${fileId}`, {
        source: 'ThingifyStore',
        function: 'startDownload',
        error: error as Error
      })
      return {
        status: false,
        statusText: 'Error Downloading File',
        operationText: error instanceof Error ? error.message : handleError(error)
      }
    }
  }

  public upload = async (filePath: string): Promise<ThingifyArchiveDownloadResult> => {
    await logger.info(`Starting upload for file ${filePath}`, {
      source: 'ThingifyStore',
      function: 'upload'
    })
    try {
      await this.uploadFile(filePath)
      await logger.info(`Upload completed for file ${filePath}`, {
        source: 'ThingifyStore',
        function: 'upload'
      })
      return {
        status: true,
        statusText: 'Uploaded',
        operationText: 'Upload Success'
      }
    } catch (error) {
      await logger.error(`Upload failed for file ${filePath}`, {
        source: 'ThingifyStore',
        function: 'upload',
        error: error as Error
      })
      return {
        status: true,
        statusText: 'Error Uploading',
        operationText: handleError(error)
      }
    }
  }

  public getStagedFileName = (): string => {
    return this.stagedFileName
  }

  public getStagedFilePath = (): string => {
    if (!this.stagedFileName) {
      throw new Error('No staged file has been selected')
    }
    const filePath = join(this.downloadLocation, this.stagedFileName)
    if (!existsSync(filePath)) {
      throw new Error(`Staged file ${this.stagedFileName} does not exist at ${filePath}`)
    }
    return filePath
  }

  public getAvailableStagedFiles = async (): Promise<string[]> => {
    try {
      return await readdir(this.downloadLocation)
    } catch (error) {
      await logger.error(`Error getting available staged files`, {
        source: 'ThingifyStore',
        function: 'getAvailableStagedFiles',
        error: error as Error
      })
      return []
    }
  }

  public selectStagedFile = async (fileName: string): Promise<string> => {
    try {
      const files = await this.getAvailableStagedFiles()
      if (!files.includes(fileName)) {
        throw new Error(`File ${fileName} not found in download location`)
      }
      this.setStagedFile(fileName)
      return `Successfully set to ${fileName}`
    } catch (error) {
      await logger.error(`Error selecting staged file ${fileName}`, {
        source: 'ThingifyStore',
        function: 'selectStagedFile',
        error: error as Error
      })
      return `Error selecting staged file: ${handleError(error)}`
    }
  }

  public downloadRecommendedFirmware = async (): Promise<string> => {
    progressBus.startOperation(
      ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD,
      'Downloading Recommended Driver',
      'Downloading Recommended Driver',
      [
        {
          channel: ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
          weight: 100
        }
      ]
    )

    // Attempt an early break if the exact match is found
    const availableFiles = await this.getAvailableStagedFiles()

    const recommendedFile = availableFiles.find((file) => file.includes('8.9.2-thinglabs'))

    if (recommendedFile) {
      logger.info(`Selecting recommended file: ${recommendedFile}`)
      this.setStagedFile(recommendedFile)
      progressBus.complete(ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD)
      progressBus.complete(ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD, 'Found installed file')
      return this.getStagedFilePath()
    }

    const recommendedFileId = 'iMktiQXVP4mC5lCe3WRQy'
    const recommendedFirmwareId = 'Sn_vBLpPfJjic6DZtCj6k'

    // Simply handles updating the progress bus with the progress event
    const handleProgress = (progressEvent: ThingifyArchiveDownloadEvent): void => {
      progressBus.update(
        progressEvent.channel,
        progressEvent.message,
        progressEvent.progress,
        progressEvent.operation
      )
    }

    progressBus.start(
      ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD,
      'Downloading File',
      'Downloading file'
    )

    this.on('downloadProgress', handleProgress)

    try {
      // Try downloading the file normally
      await this.downloadFile(recommendedFileId, recommendedFirmwareId)
      progressBus.complete(ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD)
    } catch (error) {
      // try the fallback url
      logger.error(
        `Encountered an error downloading the recommended file with ThingifyTools. Using fallback. Error: ${handleError(error)}`,
        {
          function: 'downloadRecommendedFirmware',
          source: 'thingifyStore'
        }
      )
      try {
        await this.download(this._fallback_firmware_url, '8.9.2-thinglabs-norndis.zip')
        logger.info('Finished downloading fallback firmware')
        progressBus.complete(ProgressChannel.ST_DEVICE_FIRMWARE_DOWNLOAD)
      } catch (error) {
        // try the staged files
        logger.error(
          `Encountered an error downloading the fallback firmware. Error: ${handleError(error)}`,
          {
            function: 'downloadRecommendedFirmware',
            source: 'thingifyStore'
          }
        )
        progressBus.error(
          ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD,
          'Error downloading fallback firmware',
          handleError(error)
        )
        const stagedFilePath = this.getStagedFilePath()
        if (stagedFilePath) return stagedFilePath

        // Now try and see if there are ANY available firmware
        try {
          const availableFiles = await this.getAvailableStagedFiles()

          if (availableFiles.length <= 0) {
            throw new Error('No staged file and fallback firmware failed!')
          }

          const recommendedFile = availableFiles.find((file) => file.includes('8.9.2-thinglabs'))

          if (recommendedFile) {
            logger.info(`Selecting recommended file: ${recommendedFile}`)
            this.setStagedFile(recommendedFile)
          } else {
            const fallbackFile = availableFiles[0]

            if (fallbackFile) {
              logger.info(`Selecting fallback file: ${fallbackFile}`)
              this.setStagedFile(fallbackFile)
            } else {
              throw new Error('No files found matching fallback criteria')
            }
          }
        } catch (error) {
          progressBus.error(
            ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD,
            'Failed to download firmware with both methods and nothing is staged'
          )
          logger.warn(
            'No staged file and both download attempts failed! Upload firmware manually and select it to continue'
          )
          throw error
        }
      }
    }
    progressBus.complete(ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD)
    return this.getStagedFilePath()
  }
}

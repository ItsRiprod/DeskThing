import { StoreInterface } from '@shared/interfaces/storeInterface'
import {
  ThingifyApiVersion,
  CacheableStore,
  ThingifyApiFirmware,
  ThingifyArchiveDownloadResult,
  ThingifyArchiveDownloadEvent
} from '@shared/types'
import EventEmitter from 'node:events'

export type ThingifyStoreEvents = {
  downloadProgress: [ThingifyArchiveDownloadEvent]
  stagedFileChange: [string]
}

export interface ThingifyStoreClass
  extends CacheableStore,
    StoreInterface,
    EventEmitter<ThingifyStoreEvents> {
  /**
   * Gets the available firmware to flash to the device
   */
  getAvailableFirmware(): Promise<ThingifyApiFirmware | null> // hardcoded ThingLabs route - returns the files inside

  /**
   * Gets the available files based on the versionId
   */
  getAvailableFiles(versionId: string): Promise<ThingifyApiVersion | null> // returns the files inside the thing labs version

  /**
   * Starts the download of a specific resource
   * @param fileId
   */
  startDownload(versionId: string, fileId: string): Promise<ThingifyArchiveDownloadResult>

  /**
   * Starts the download of a specific resource
   * @param fileId
   */
  upload(filePath: string): Promise<ThingifyArchiveDownloadResult>

  /**
   * Gets the staged file name
   */
  getStagedFileName(): string

  /**
   * Gets the staged file name
   */
  getStagedFilePath(): string

  /**
   * Gets the names of the files in the staged directory
   */
  getAvailableStagedFiles(): Promise<string[]>

  /**
   * Gets the names of the files in the staged directory
   */
  downloadRecommendedFirmware(): Promise<string>

  /**
   * Sets an existing staged file as the one to use
   */
  selectStagedFile(fileName: string): Promise<string>
}

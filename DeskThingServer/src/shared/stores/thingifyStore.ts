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
}

export interface ThingifyStoreClass
  extends CacheableStore,
    StoreInterface,
    EventEmitter<ThingifyStoreEvents> {
    
  /**
   * Gets the available firmware to flash to the device
   */
  getAvailableFirmware(): Promise<ThingifyApiFirmware[]> // hardcoded ThingLabs route - returns the files inside
  
  /**
   * Gets the available files based on the versionId
   */
  getAvailableFiles(versionId: string): Promise<ThingifyApiVersion | null> // returns the files inside the thing labs version
  
  /**
   * Starts the download of a specific resource
   * @param fileId 
   */
  startDownload(fileId: string): Promise<ThingifyArchiveDownloadResult>

  /**
   * Starts the download of a specific resource
   * @param fileId 
   */
  upload(filePath: string): Promise<ThingifyArchiveDownloadResult>
}

import { CacheableStore, ThingifyApiFirmware, ThingifyApiVersion, ThingifyArchiveDownloadResult } from '@shared/types'
import EventEmitter from 'node:events'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'
import { handleError } from '@server/utils/errorHandler'
import logger from '@server/utils/logger'
import { ThingifyStoreClass, ThingifyStoreEvents } from '@shared/stores/thingifyStore'
import type { FlashEvent } from 'flashthing'

export class ThingifyStore
  extends EventEmitter<ThingifyStoreEvents>
  implements CacheableStore, ThingifyStoreClass
{
  private _initialized: boolean = false

  public get initialized(): boolean {
    return this._initialized
  }

  constructor() {
    super()
  }
  
  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
  }

  public clearCache = async (): Promise<void> => {}
  
  public saveToFile = async (): Promise<void> => {
    // No persistent data to save
  }
  
  startDownload(fileId: string): Promise<ThingifyArchiveDownloadResult> {
    throw new Error('Method not implemented.')
  }

  public getAvailableFirmware = async (): Promise<ThingifyApiFirmware[]> => {
    return []
  }

  public getAvailableFiles = async (versionId: string): Promise<ThingifyApiVersion | null> => {
    return null
  }
}

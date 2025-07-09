import { ProgressEvent } from './progress'

/**
 * What is emitted during the download from thingify.tools
 */
export type ThingifyArchiveDownloadEvent = ProgressEvent

/**
 */
export type ThingifyArchiveDownloadResult = {
  /**
   * Success or failure
   */
  status: boolean
  statusText: string
  operationText: string
}

/**
 * https://thingify.tools/api/v1/firmware
 */
export type ThingifyApiFirmware = {
  id: string
  name: string
  description: string
  image: string
  createdAt: number | null
  updatedAt: number | null
  /**
   * https://thingify.tools/api/v1/firmware/
   *
   * The total number of downloads
   */
  totalDownloads?: number
  /**
   * https://thingify.tools/api/v1/firmware/[id]
   *
   * The array of versions
   */
  versions?: ThingifyApiFirmwareVersion[]
}

/**
 * https://thingify.tools/api/v1/firmware/[id]
 *
 * Inside {@link ThingifyApiFirmware.versions}
 */
export type ThingifyApiFirmwareVersion = {
  id: string
  version: string
  changelog: string
  downloadCount: number
  createdAt: number | null
}

export type ThingifyApiVersion = {
  id: string
  firmwareId: string
  version: string
  changelog: string
  tag: string
  downloadCount: number
  createdAt: number | null
  files: ThingifyApiVersionFile[]
}

export type ThingifyApiVersionFile = {
  id: string
  fileName: string
  fileSize: number
  createdAt: number | null
  downloadUrl: string
}

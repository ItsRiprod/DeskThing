import {
  AppReleaseFile,
  AppReleaseFile01111,
  ClientReleaseFile,
  ClientReleaseFile01111
} from '@shared/types'
import { readFromFile, writeToFile } from './fileService'
import { join } from 'node:path'
import logger from '@server/utils/logger'
import { assertReleaseFileMigration } from '../releases/migrationUtils'

export const saveAppReleaseData = async (appReleaseFile: AppReleaseFile): Promise<void> => {
  try {
    const appReleasePath = join('system', 'appReleases.json')
    await writeToFile(appReleaseFile, appReleasePath)
  } catch (error) {
    logger.error(`Failed to save app release files`, {
      error: error as Error,
      function: 'saveAppReleaseFile',
      source: 'releaseFileService'
    })
    throw new Error(`Failed to save app release data`, { cause: error })
  }
}

export const saveClientReleaseData = async (
  clientReleaseFile: ClientReleaseFile
): Promise<void> => {
  try {
    const clientReleasePath = join('system', 'clientReleases.json')
    await writeToFile(clientReleaseFile, clientReleasePath)
  } catch (error) {
    logger.error(`Failed to save client release files`, {
      error: error as Error,
      function: 'saveClientReleaseFile',
      source: 'releaseFileService'
    })
    throw new Error(`Failed to save app release data`, { cause: error })
  }
}

export const readAppReleaseData = async (): Promise<AppReleaseFile01111 | undefined> => {
  try {
    const appReleasePath = join('system', 'appReleases.json')

    const appReleaseFile = await readFromFile<AppReleaseFile>(appReleasePath)

    if (!appReleaseFile) throw new Error('Invalid app release file (does not exist)')

    return assertReleaseFileMigration(appReleaseFile)
  } catch (error) {
    logger.error(`Failed to read app release files`, {
      error: error as Error,
      function: 'readAppReleaseData',
      source: 'releaseFileService'
    })
    throw new Error(`Failed to read app release data`, { cause: error })
  }
}

export const readClientReleaseData = async (): Promise<ClientReleaseFile01111 | undefined> => {
  try {
    const clientReleasePath = join('system', 'clientReleases.json')

    const clientReleaseFile = await readFromFile<ClientReleaseFile>(clientReleasePath)

    if (!clientReleaseFile) throw new Error('Invalid client release file (does not exist)')

    return assertReleaseFileMigration(clientReleaseFile)
  } catch (error) {
    logger.error(`Failed to read client release files`, {
      error: error as Error,
      function: 'readClientReleaseData',
      source: 'releaseFileService'
    })
    throw new Error(`Failed to read app release data`, { cause: error })
  }
}

import { AppReleaseFile, ClientReleaseFile } from '@shared/types'
import { readFromFile, writeToFile } from './fileService'
import { join } from 'node:path'
import logger from '@server/utils/logger'
import { isValidAppReleaseFile, isValidClientReleaseFile } from '../github/githubUtils'

export const saveAppReleaseData = async (appReleaseFile: AppReleaseFile): Promise<void> => {
  try {
    isValidAppReleaseFile(appReleaseFile)
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
    isValidClientReleaseFile(clientReleaseFile)
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

export const readAppReleaseData = async (): Promise<AppReleaseFile | undefined> => {
  try {
    const appReleasePath = join('system', 'appReleases.json')

    const appReleaseFile = await readFromFile<AppReleaseFile>(appReleasePath)

    isValidAppReleaseFile(appReleaseFile)

    return appReleaseFile
  } catch (error) {
    logger.error(`Failed to read app release files`, {
      error: error as Error,
      function: 'readAppReleaseData',
      source: 'releaseFileService'
    })
    throw new Error(`Failed to read app release data`, { cause: error })
  }
}

export const readClientReleaseData = async (): Promise<ClientReleaseFile | undefined> => {
  try {
    const clientReleasePath = join('system', 'clientReleases.json')

    const clientReleaseFile = await readFromFile<ClientReleaseFile>(clientReleasePath)

    isValidClientReleaseFile(clientReleaseFile)

    return clientReleaseFile
  } catch (error) {
    logger.error(`Failed to read client release files`, {
      error: error as Error,
      function: 'readClientReleaseData',
      source: 'releaseFileService'
    })
    throw new Error(`Failed to read app release data`, { cause: error })
  }
}

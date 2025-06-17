
import { updateLoadingStatus } from '@server/windows/loadingWindow'
import { Settings } from '@shared/types'
import { app } from 'electron'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const checkFlag = async (flagKey: keyof Settings): Promise<boolean> => {
  const settingsPath = join(app.getPath('userData'), 'settings.json')

  updateLoadingStatus(`Checking flag: ${flagKey}`)
  try {
    const settings = JSON.parse(await readFile(settingsPath, 'utf-8')) as Settings
    return settings?.[flagKey] === true
  } catch (error) {
    updateLoadingStatus('Settings file not found', error)
    return false
  }
}

import { getAppFilePath } from '../apps/appUtils'
import path from 'node:path'
import { app } from 'electron'
import { readFile } from 'node:fs/promises'
import { Action } from '@deskthing/types'
import logger from '@server/utils/logger'

export const FetchIcon = async (action: Action): Promise<string | null> => {
  if (!action) return null

  if (!action.source) {
    logger.warn('Unable to fetch icon for action: source is not defined', {
      source: 'FetchIcon'
    })
    return null
  }

  try {
    const iconPath =
      action.source === 'server'
        ? path.join(app.getPath('userData'), 'webapp', 'icons', `${action.icon || action.id}.svg`)
        : path.join(getAppFilePath(action.source), 'icons', `${action.icon || action.id}.svg`)

    return await readFile(iconPath, 'utf8')
  } catch (error) {
    logger.info('Error reading icon file', { error: error as Error })
    return null
  }
}

import { app } from 'electron'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import logger from './logger'

export const getResourcesPath = (...pathSegments: string[]): string => {
  // In development
  if (process.env.NODE_ENV === 'development') {
    return join(process.cwd(), 'resources', ...pathSegments)
  }

  // In production - this points to the unpacked resources directory
  const path = join(
    dirname(app.getAppPath()),
    process.platform === 'darwin' ? 'Resources' : 'resources',
    'app.asar.unpacked',
    'resources',
    ...pathSegments
  )

  if (!existsSync(path)) {
    logger.warn(`Resources path not found: ${path}`, {
      function: 'getResourcesPath'
    })
  }

  return path
}

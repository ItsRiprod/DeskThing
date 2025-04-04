/**
 * Environment configuration utilities
 */
import { join, dirname } from 'node:path'
import { app } from 'electron'
import dotenv from 'dotenv'

/**
 * Initialize environment variables based on current environment
 */
export function initializeEnvironment(): void {
  if (process.env.NODE_ENV === 'development') {
    dotenv.config()
  } else {
    const userDataPath = dirname(app.getPath('exe'))
    const envPath = join(userDataPath, '.env.production')
    dotenv.config({ path: envPath })
  }
}

// Auto-initialize when imported
initializeEnvironment()

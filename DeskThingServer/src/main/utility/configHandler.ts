import { app } from 'electron'
import { join, dirname } from 'path'
import * as fs from 'fs'

let appsConfigPath: string

function setupConfig(): string {
  appsConfigPath = join(app.getPath('userData'), 'apps.json')
  ensureConfigFileExists()
  return appsConfigPath
}

function ensureConfigFileExists(): void {
  // Ensure the directory exists
  const configDir = dirname(appsConfigPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  // Ensure the config file exists
  if (!fs.existsSync(appsConfigPath)) {
    fs.writeFileSync(appsConfigPath, JSON.stringify({ apps: [] }, null, 2))
  }
}

const getConfig = (): string => {
  return appsConfigPath
}
const getConfigData = (): any => {
  const appsConfigData = fs.readFileSync(appsConfigPath, 'utf8')
  const appsConfig = JSON.parse(appsConfigData)
  return appsConfig
}

export { ensureConfigFileExists, setupConfig, getConfig, getConfigData }

import { app } from 'electron/main'
import crypto from 'crypto'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { config } from 'dotenv'

config()

type Secrets = Record<string, string>

interface AppConfig {
  secrets: Secrets
  meta?: {
    hasSecrets?: boolean
  }
}

let configuration: AppConfig | null = null
let decryptedSecrets: Secrets = {}

function createDecryptionKey(): Buffer {
  // Must match the salt and keyMaterial from electron-builder.env.js
  const keyMaterial = `${app.getVersion()}-deskthing-secrets`
  return crypto.scryptSync(keyMaterial, 'dt-salt-v1', 32)
}

function decrypt(encryptedData: string): string {
  if (!encryptedData) return ''
  try {
    const key = createDecryptionKey()
    const [ivHex, encrypted] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt secret:', error)
    return ''
  }
}

function addSecretsToEnv(): void {
  if (!configuration || !configuration.secrets) return

  if (!decryptedSecrets) {
    decryptSecrets()
  }

  for (const [key, value] of Object.entries(decryptedSecrets)) {
    process.env[key] = value
  }
}

function loadConfig(): void {
  try {
    const configPath = join(process.resourcesPath, 'config.json')
    if (existsSync(configPath)) {
      const configData = readFileSync(configPath, 'utf8')
      configuration = JSON.parse(configData) as AppConfig
      decryptSecrets()
      addSecretsToEnv()
    } else {
      console.warn('No config file found, using empty secrets')
      configuration = { secrets: {} }
      decryptedSecrets = {}
    }
  } catch (error) {
    console.error('Failed to load config:', error)
    configuration = { secrets: {} }
    decryptedSecrets = {}
  }
}

function decryptSecrets(): void {
  if (!configuration) return
  decryptedSecrets = {}
  for (const [key, value] of Object.entries(configuration.secrets)) {
    decryptedSecrets[key] = decrypt(value)
  }
}

function getSecret(key: string): string {
  return decryptedSecrets[key] || ''
}

function hasSecret(key: string): boolean {
  return Boolean(decryptedSecrets[key])
}

function getConfig(): AppConfig | null {
  return configuration
}

// Immediately load config on import
loadConfig()

export { getSecret, hasSecret, getConfig, loadConfig }

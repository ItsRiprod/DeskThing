import { writeFileSync, readFileSync } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

config()

// Read package.json for app metadata
const _filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(_filename)
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))

// Create encryption key from app metadata
const keyMaterial = `${packageJson.version}-deskthing-secrets`
const encryptionKey = crypto.scryptSync(keyMaterial, 'dt-salt-v1', 32)

function encryptSecret(secret) {
  if (!secret) return ''

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv)

  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return iv.toString('hex') + ':' + encrypted
}

const buildConfig = {
  // Encrypted secrets from GitHub Actions
  secrets: {
    DISCORD_WEBHOOK_URL: encryptSecret(process.env.DISCORD_WEBHOOK_URL),
    BUYMEACOFFEE_TOKEN: encryptSecret(process.env.BUYMEACOFFEE_TOKEN)
  },

  meta: {
    hasSecrets: Boolean(process.env.DISCORD_WEBHOOK_URL || process.env.BUYMEACOFFEE_TOKEN)
  }
}

const configPath = path.resolve(__dirname, 'src/main/config.json')
writeFileSync(configPath, JSON.stringify(buildConfig, null, 2))

console.log(`✅ Build config written to ${configPath}`)
console.log(`📦 Secrets included: ${buildConfig.meta.hasSecrets}`)

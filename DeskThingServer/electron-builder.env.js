// Builds environment variables into production .env file
import { writeFileSync } from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

config()

const env = {
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL
}

// Write env file
const _filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(_filename)
const envPath = path.resolve(__dirname, '.env.production')

writeFileSync(
  envPath,
  Object.entries(env)
    .map(([key, val]) => `${key}=${val}`)
    .join('\n')
)

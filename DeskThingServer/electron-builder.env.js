// Builds environment variables into production .env file
import { writeFileSync } from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

config()

const appConfig = {
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || ''
}

// Write env file
const _filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(_filename)
const configPath = path.resolve(__dirname, 'src/main/config.json')

writeFileSync(configPath, JSON.stringify(appConfig, null, 2))
console.log(`Config file written to ${configPath}`)

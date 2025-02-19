// Builds environment variables into production .env file
const { writeFileSync } = require('fs')
const path = require('path')

const { config } = require('dotenv')
config()

const env = {
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL
}

// Write env file
const envPath = path.resolve(__dirname, '.env.production')

writeFileSync(
  envPath,
  Object.entries(env)
    .map(([key, val]) => `${key}=${val}`)
    .join('\n')
)

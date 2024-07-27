import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
const RPC = require('discord-rpc');
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DiscordHandler {
  constructor(sendDataToMainFn) {
    this.client_secret = undefined
    this.client_id = undefined
    this.token = undefined
    this.sendDataToMainFn = sendDataToMainFn
    this.redirect_url = 'http://localhost:8888/callback/discord'
    this.scopes = ['rpc', 'messages.read', 'rpc.video.write', 'rpc.voice.read', 'rpc.activities.write', 'rpc', 'rpc.voice.write', 'rpc.screenshare.read', 'rpc.notifications.read', 'rpc.video.read', 'rpc.screenshare.write']
    this.rpc = new RPC.Client({ transport: 'ipc' })
    this.settings = {
      "auto_switch_view": {
        "value": 'true',
        "label": "Auto Focus",
        "options": [
          {
            "value": 'false',
            "label": "Disabled"
          },
          {
            "value": 'true',
            "label": "Enabled"
          },
        ]
      },
      "notifications": {
        "value": 'true',
        "label": "Notifications",
        "options": [
          {
            "value": 'false',
            "label": "Disabled"
          },
          {
            "value": 'true',
            "label": "Enabled"
          },
        ]
      }
    }
    const manifestPath = path.join(__dirname, 'manifest.json');
    this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }

  async sendLog(message) {
    this.sendDataToMainFn('log', message)
  }
  async sendError(message) {
    this.sendDataToMainFn('error', message)
  }

  async login() {
    try {
      await this.rpc.connect(this.client_id);
      
      if (this.token == null) {
        this.token = await this.rpc.authorize({ scopes: this.scopes, clientSecret: this.client_secret, redirectUri: this.redirect_url })
        this.sendDataToMainFn('add', {token: this.token})
      }
      this.rpc.authenticate(this.token)
      
    } catch (ex) {
      this.sendError('Discord RPC Error: '+ ex)
    }
  }

}

export default DiscordHandler

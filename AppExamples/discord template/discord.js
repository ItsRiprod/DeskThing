// All of these are app-dependent
const RPC = require('discord-rpc');

// This is to get the manifest file
const path = require('path');
const fs = require('fs');

class DiscordHandler {
  constructor(sendDataToMainFn) {
    // Pass this through the constructor
    this.sendDataToMainFn = sendDataToMainFn
    
    this.client_secret = undefined
    this.client_id = undefined
    this.token = undefined

    // Discord-specific data
    this.redirect_url = 'http://localhost:8888/callback/discord'
    this.scopes = ['rpc', 'messages.read', 'rpc.video.write', 'rpc.voice.read', 'rpc.activities.write', 'rpc', 'rpc.voice.write', 'rpc.screenshare.read', 'rpc.notifications.read', 'rpc.video.read', 'rpc.screenshare.write']
    this.rpc = new RPC.Client({ transport: 'ipc' })
    
    // Settings structure - must match this 
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

  // utility function to send data to and from the server (logs or errors - errors prompt the user. You can also have 'message' which will have a gray message on the desktop UI)
  async sendLog(message) {
    this.sendDataToMainFn('log', message)
  }
  async sendError(message) {
    this.sendDataToMainFn('error', message)
  }

  // EVERYTHING BELOW HERE is optional for your app

  // Logging in with OAuth flow
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

module.exports = DiscordHandler

// This is to get the manifest file
const path = require('path');
const fs = require('fs');

class timerHandler {
  constructor(sendDataToMainFn) {
    // Pass this through the constructor
    this.sendDataToMainFn = sendDataToMainFn
    
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
}

module.exports = timerHandler

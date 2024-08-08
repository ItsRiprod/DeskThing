const fs = require('fs');
const path = require('path');

class UtilityHandler {
  constructor(sendDataToMainFn) {
    this.sendDataToMainFn = sendDataToMainFn
    this.settings = {
      "playback_location": {
        "value": 'local',
        "label": "Playback Location",
        "options": [
          {
            "value": 'local',
            "label": "Local"
          },
        ]
      }
    }
    const manifestPath = path.join(__dirname, 'manifest.json');
    this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));


  }

  // Handles the audio control requests and routes them to the specific handler
  handleCommand(type, command, payload) {
    switch (command) {
      case 'next':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'previous':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'rewind':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'fast_forward':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'play':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'pause':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'seek':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'like':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'song':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'volume':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'repeat':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      case 'shuffle':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, command, payload);
        break;
      default:
        this.sendDataToMainFn('error', `Unsupported command ${command}!`)
        console.warn('Unsupported command:', command);
        break;
    }
  }
}

module.exports = UtilityHandler

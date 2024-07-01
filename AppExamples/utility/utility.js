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

    console.log('UTILITY: Manifest loaded:', this.manifest);

  }

  // Handles the audio control requests and routes them to the specific handler
  handleCommand(type, command, payload) {
    switch (command) {
      case 'set_repeat':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'set_repeat', payload);
        break;
      case 'set_shuffle':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'set_shuffle', payload);
        break;
      case 'seek_track':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'seek_track', payload);
        break;
      case 'play_track':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'play_track', payload);
        break;
      case 'pause_track':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'pause_track', payload);
        break;
      case 'next_track':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'next_track', payload);
        break;
      case 'previous_track':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'previous_track', payload);
        break;
      case 'device_info':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'device_info', payload);
        break;
      case 'song_info':
        this.sendDataToMainFn('toApp', this.settings.playback_location.value, type, 'song_info', payload);
        break;
      default:
        console.warn('Unsupported command:', command);
        break;
    }
  }
}

module.exports = UtilityHandler

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class MediaWin {
  constructor(sendDataToMainFn) {
    this.sendDataToMainFn = sendDataToMainFn
    this.settings = {
      "refresh_interval": {
        "value": 30000,
        "label": "Refresh interval",
        "options": [
          {
            "value": 0,
            "label": "Disabled"
          },
          {
            "value": 5000,
            "label": "5 seconds"
          },
          {
            "value": 30000,
            "label": "30 seconds"
          },
        ]
      }
    };

    this.cliPath = path.join(__dirname, 'DeskThingMediaCLI.exe');

    const manifestPath = path.join(__dirname, 'manifest.json');
    this.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    this.sendLog('Manifest loaded:', this.manifest);
  }

  async sendLog(message) {
    this.sendDataToMainFn('log', message)
  }
  async sendError(message) {
    this.sendDataToMainFn('error', message)
  }

  async returnSongData(id = null, retryCount = 0) {
    try {
      const result = await this.executeCommand('')
      if (result === false) {
        this.sendError('Music Data returned false! There was an error');
        return false;
      } else {

        // Check if result.id is different from the passed id
        if (result.id !== id) {
          const musicData = result;
          musicData.thumbnail = "data:image/png;base64," + musicData.thumbnail;
          musicData.volume = await this.getVolumeInfo();
          musicData.can_change_volume = true;
          this.sendLog('Returning song data');
      
          return musicData
        } else {
          // Retry logic up to 5 attempts
          if (retryCount < 5) {
            this.sendLog(`Retry attempt ${retryCount + 1} for next command.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
          return this.returnSongData(id, retryCount + 1); // Recursive call with incremented retryCount
        } else {
          this.sendError(`Reached maximum retry attempts for next command.`);
          return false;
        }
      }
      }
    } catch (error) {
      this.sendError(`Error executing next command: ${error}`);
      return false;
    }
  }

  async executeCommand(command, args = '') {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} ${command} ${args}`, (error, stdout, stderr) => {
        if (error) {
          this.sendError(`exec error: ${error}`);
          reject(false);
          return;
        }

        try {
          const result = JSON.parse(stdout);
          this.sendLog(`${command} with response` + stdout);
          resolve(result);
        } catch (parseError) {
          this.sendError('Error parsing JSON:' + parseError);
          reject(false);
        }
      });
    });
  }

  async exeVol(...args) {
    const executablePath = path.join(__dirname, 'adjust_get_current_system_volume_vista_plus.exe')

    return new Promise((resolve, reject) => {
      exec(`${executablePath} ${args}`, (error, stdout, stderr) => {
        if (error) {
          this.sendError(`exec error: ${error}`);
          reject(false);
          return;
        }

        try {
          resolve(stdout);
        } catch (parseError) {
          this.sendError('Error parsing JSON:' + parseError);
          reject(false);
        }
      });
    });
  }

  async getVolumeInfo () {
    const data = await this.exeVol()
    const args = data.split(' ')
  
    return parseInt(args[0], 10)
  }

  async next(id) {
    const result = await this.executeCommand('next');
    if (result.success) {
      return await this.returnSongData(id)
    }
    return false
  }

  async previous() {
    return this.executeCommand('previous');
  }

  async fastForward(seconds) {
    return this.executeCommand('fastforward', seconds);
  }

  async rewind(seconds) {
    return this.executeCommand('rewind', seconds);
  }

  async play() {
    return this.executeCommand('play');
  }

  async pause() {
    return this.executeCommand('pause');
  }

  async stop() {
    return this.executeCommand('stop');
  }

  async seek(positionMs) {
    return this.executeCommand('seek', positionMs);
  }

  async volume(volumePercentage) {
    this.exeVol(String(volumePercentage));
    return true
  }

  async repeat(state) {
    return this.executeCommand('setrepeat', state);
  }

  async shuffle(state) {
    return this.executeCommand('setshuffle', state);
  }
}

module.exports = MediaWin

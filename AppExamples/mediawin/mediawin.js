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

    console.log('MediaWin: Manifest loaded:', this.manifest);
  }

  async sendLog(message) {
    this.sendDataToMainFn('log', message)
  }
  async sendError(message) {
    this.sendDataToMainFn('error', message)
  }

  async returnSongData() {
    return new Promise((resolve, reject) => {
      exec(this.cliPath, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(error);
          return;
        }
        
        try {
          // Parse the JSON output into musicData object
          const musicData = JSON.parse(stdout);

          musicData.photo = "data:image/png;base64," + musicData.photo
          
          this.sendLog('Returning song data');
          resolve(musicData);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(parseError);
        }
      });
    });
  }


  async skipToNext() {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} next`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          this.sendLog('Skipped with response', stdout)
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }

  async skipToPrev() {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} previous`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          this.sendLog('Skipped with response', stdout)
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }

  async play() {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} play`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          this.sendLog('Played with response', stdout)
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }

  async pause() {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} pause`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          this.sendLog('Paused with response', stdout)
          const result = JSON.parse(stdout);
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }

  async setShuffle(state) {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} setshuffle ${state}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          this.sendLog('Set Shuffle with response', stdout)
          const result = JSON.parse(stdout);
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }

  async setRepeat(state) {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} setrepeat ${state}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          this.sendLog('Set Repeat with response', stdout)
          const result = JSON.parse(stdout);
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }

  async seek(position_ms) {
    return new Promise((resolve, reject) => {
      exec(`${this.cliPath} seek ${position_ms}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          sendError(`exec error: ${error}`);
          reject(false);
          return;
        }
        
        try {
          this.sendLog('Seeked with response', stdout)
          const result = JSON.parse(stdout);
          resolve(result.success);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          reject(false);
        }
      });
    });
  }
}

module.exports = MediaWin

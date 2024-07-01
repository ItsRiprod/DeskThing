var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// utility.js
var require_utility = __commonJS({
  "utility.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var UtilityHandler2 = class {
      constructor(sendDataToMainFn) {
        this.sendDataToMainFn = sendDataToMainFn;
        this.settings = {
          "playback_location": {
            "value": "local",
            "label": "Playback Location",
            "options": [
              {
                "value": "local",
                "label": "Local"
              }
            ]
          }
        };
        const manifestPath = path.join(__dirname, "manifest.json");
        this.manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        console.log("UTILITY: Manifest loaded:", this.manifest);
      }
      // Handles the audio control requests and routes them to the specific handler
      handleCommand(type, command, payload) {
        switch (command) {
          case "set_repeat":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "set_repeat", payload);
            break;
          case "set_shuffle":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "set_shuffle", payload);
            break;
          case "seek_track":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "seek_track", payload);
            break;
          case "play_track":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "play_track", payload);
            break;
          case "pause_track":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "pause_track", payload);
            break;
          case "next_track":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "next_track", payload);
            break;
          case "previous_track":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "previous_track", payload);
            break;
          case "device_info":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "device_info", payload);
            break;
          case "song_info":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, "song_info", payload);
            break;
          default:
            console.warn("Unsupported command:", command);
            break;
        }
      }
    };
    module2.exports = UtilityHandler2;
  }
});

// index.js
var UtilityHandler = require_utility();
var utility;
async function start({ sendDataToMain }) {
  console.log("UTILITY: App started!");
  utility = new UtilityHandler(sendDataToMain);
  sendDataToMain("get", "data");
}
async function stop() {
  console.log("UTILITY: App stopping...");
  utility = null;
}
async function onMessageFromMain(event, ...args) {
  console.log(`UTILITY: Received event ${event} with args `, ...args);
  try {
    switch (event) {
      case "message":
        break;
      case "data":
        if (args[0] == null) {
          const data = {
            settings: utility.settings
          };
          utility.sendDataToMainFn("set", data);
        } else {
          utility.settings = args[0].settings;
          utility.sendDataToMainFn("get", "config", "audiosources");
        }
        break;
      case "config":
        if (args[0] == void 0) {
          console.log("UTILITY: Unknown config data received");
        } else {
          if (args[0].audiosources) {
            const sources = [];
            args[0].audiosources.map((value) => {
              sources.push({
                label: value,
                value
              });
            });
            utility.settings.playback_location.options = sources;
            const data = {
              settings: utility.settings
            };
            utility.sendDataToMainFn("set", data);
          }
        }
        break;
      case "get":
        handleGet(...args);
        break;
      case "set":
        handleSet(...args);
        break;
      default:
        console.log("UTILITY: Unknown message:", event, ...args);
        break;
    }
  } catch (error) {
    console.error("UTILITY: Error in onMessageFromMain:", error);
  }
}
var handleGet = async (...args) => {
  console.log("UTILITY: Handling GET request", ...args);
  if (args[0] == null) {
    console.log("UTILITY: No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "manifest":
      response = utility.manifest;
      utility.sendDataToMainFn("manifest", response);
    default:
      response = utility.handleCommand("get", ...args);
      break;
  }
  utility.sendDataToMainFn("data", response);
};
var handleSet = async (...args) => {
  console.log("UTILITY: Handling SET request", ...args);
  if (args[0] == null) {
    console.log("UTILITY: No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "update_setting":
      if (args[1] != null) {
        const { setting, value } = args[1];
        utility.settings[setting].value = value;
        console.log("UTILITY New Setting", utility.settings);
        response = { settings: utility.settings };
        utility.sendDataToMainFn("add", response);
      } else {
        console.log("UTILITY: No args provided", args[1]);
        response = "No args provided";
      }
      break;
    default:
      response = utility.handleCommand("set", ...args);
      break;
  }
  console.log("UTILITY: Response", response);
  utility.sendDataToMainFn("data", response);
};
module.exports = { start, onMessageFromMain, stop };

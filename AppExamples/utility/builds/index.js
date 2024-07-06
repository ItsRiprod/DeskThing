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
      }
      // Handles the audio control requests and routes them to the specific handler
      handleCommand(type, command, payload) {
        switch (command) {
          case "next":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "previous":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "rewind":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "fast_forward":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "play":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "pause":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "seek":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "like":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "song":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "volume":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "repeat":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          case "shuffle":
            this.sendDataToMainFn("toApp", this.settings.playback_location.value, type, command, payload);
            break;
          default:
            this.sendDataToMainFn("error", `Unsupported command ${command}!`);
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
var listeners = [];
async function start({ sendDataToMain, sysEvents }) {
  utility = new UtilityHandler(sendDataToMain);
  sysEvents = sysEvents;
  const removeConfigListener = sysEvents("config", handleConfigEvent);
  listeners.push(removeConfigListener);
  sendDataToMain("get", "data");
  sendLog("App started successfully!");
}
async function stop() {
  sendLog("App stopping...");
  listeners.forEach((removeListener) => removeListener());
  listeners.length = 0;
  utility = null;
}
var handleConfigEvent = async () => {
  sendLog("Handling Config Event");
  utility.sendDataToMainFn("get", "config", "audiosources");
};
var sendLog = (message) => {
  utility.sendDataToMainFn("log", message);
};
var sendError = (message) => {
  utility.sendDataToMainFn("error", message);
};
async function onMessageFromMain(event, ...args) {
  sendLog(`Received event ${event} with args `, ...args);
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
          sendLog(" Unknown config data received");
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
        sendError("Unknown message:", event, ...args);
        break;
    }
  } catch (error) {
    sendError("Error in onMessageFromMain:", error);
  }
}
var handleGet = async (...args) => {
  if (args[0] == null) {
    sendError("No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "manifest":
      response = utility.manifest;
      utility.sendDataToMainFn("manifest", response);
      break;
    default:
      response = utility.handleCommand("get", ...args);
      break;
  }
  utility.sendDataToMainFn("data", response);
};
var handleSet = async (...args) => {
  if (args[0] == null) {
    sendError("UTILITY: No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "update_setting":
      if (args[1] != null) {
        const { setting, value } = args[1];
        utility.settings[setting].value = value;
        sendLog("New Setting", utility.settings);
        const settings = { settings: utility.settings };
        utility.sendDataToMainFn("add", settings);
      } else {
        sendError("No args provided");
        response = "No args provided";
      }
      break;
    default:
      response = utility.handleCommand("set", ...args);
      break;
  }
  if (response != null) {
    utility.sendDataToMainFn("data", response);
  }
};
module.exports = { start, onMessageFromMain, stop };

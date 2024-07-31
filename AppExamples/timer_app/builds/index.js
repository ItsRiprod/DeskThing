var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// timer.js
var require_timer = __commonJS({
  "timer.js"(exports2, module2) {
    var path = require("path");
    var fs = require("fs");
    var timerHandler2 = class {
      constructor(sendDataToMainFn) {
        this.sendDataToMainFn = sendDataToMainFn;
        this.settings = {
          "auto_switch_view": {
            "value": "true",
            "label": "Auto Focus",
            "options": [
              {
                "value": "false",
                "label": "Disabled"
              },
              {
                "value": "true",
                "label": "Enabled"
              }
            ]
          },
          "notifications": {
            "value": "true",
            "label": "Notifications",
            "options": [
              {
                "value": "false",
                "label": "Disabled"
              },
              {
                "value": "true",
                "label": "Enabled"
              }
            ]
          }
        };
        const manifestPath = path.join(__dirname, "manifest.json");
        this.manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      }
      // utility function to send data to and from the server (logs or errors - errors prompt the user. You can also have 'message' which will have a gray message on the desktop UI)
      async sendLog(message) {
        this.sendDataToMainFn("log", message);
      }
      async sendError(message) {
        this.sendDataToMainFn("error", message);
      }
    };
    module2.exports = timerHandler2;
  }
});

// index.js
var timerHandler = require_timer();
var timer;
async function start({ sendDataToMain }) {
  timer = new timerHandler(sendDataToMain);
  sendDataToMain("get", "data");
  timer.sendLog("App started successfully!");
  timer.sendDataToMainFn("data", { type: "message", data: "Hello from the timer app!" });
}
async function stop() {
  timer.sendLog("App stopping...");
  timer = null;
}
async function onMessageFromMain(event, ...args) {
  timer.sendLog(`Received event ${event} with args `, ...args);
  try {
    switch (event) {
      case "message":
        break;
      case "data":
        break;
      case "callback-data":
        break;
      case "get":
        handleGet(...args);
        break;
      case "set":
        handleSet(...args);
        break;
      default:
        timer.sendError("Unknown message:" + event);
        break;
    }
  } catch (error) {
    timer.sendError("Error in onMessageFromMain:" + error);
  }
}
var handleGet = async (...args) => {
  if (args[0] == null) {
    timer.sendError("No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "manifest":
      response = timer.manifest;
      timer.sendDataToMainFn("manifest", response);
      break;
    default:
      response = timer.handleCommand("get", ...args);
      break;
  }
  timer.sendDataToMainFn("data", response);
};
var handleSet = async (...args) => {
  if (args[0] == null) {
    timer.sendError("No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "update_setting":
      if (args[1] != null) {
        const { setting, value } = args[1];
        timer.settings[setting].value = value;
        timer.sendLog("New Setting", timer.settings);
        const settings = { settings: timer.settings };
        timer.sendDataToMainFn("add", settings);
      } else {
        timer.sendError("No args provided");
        response = "No args provided";
      }
      break;
    default:
      response = timer.handleCommand("set", ...args);
      break;
  }
  if (response != null) {
    timer.sendDataToMainFn("data", response);
  }
};
module.exports = { start, onMessageFromMain, stop };

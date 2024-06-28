var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// utility.js
var require_utility = __commonJS({
  "utility.js"(exports2, module2) {
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
              },
              {
                "value": "spotify",
                "label": "Spotify"
              },
              {
                "value": "other",
                "label": "Other"
              }
            ]
          }
        };
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
    default:
      response = `${args[0].toString()} Not implemented yet!`;
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
      console.log("UTILITY: Unknown request", args[0].toString());
      response = `${args[0].toString()} Not implemented yet!`;
      break;
  }
  console.log("UTILITY: Response", response);
  utility.sendDataToMainFn("data", response);
};
module.exports = { start, onMessageFromMain, stop };

// index.js
var fs = require("fs");
var path = require("path");
var sendDataToMainFn;
var manifest;
var settings = {
  "setting_example_message": {
    // The name of the setting
    "value": "message1",
    // The current value of the setting
    "label": "Setting Example Message",
    // The label of this setting to be displayed
    "options": [
      // An array of options for that setting
      {
        // Ensure you include the default data in the options
        "value": "message1",
        // The value of this option
        "label": "Set to Message1"
        // The label of this option
      },
      {
        "value": "message2",
        // The value of this option
        "label": "Set to Message2"
        // The label of this option
      }
    ]
  }
};
async function start({ sendDataToMain }) {
  console.log("TEMPLATE: App started!");
  sendDataToMainFn = sendDataToMain;
  const manifestPath = path.join(__dirname, "manifest.json");
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  sendDataToMain("get", "data");
}
async function stop() {
  console.log("TEMPLATE: App stopping...");
  sendDataToMainFn = null;
}
async function onMessageFromMain(event, ...args) {
  console.log(`TEMPLATE: Received event ${event} with args `, ...args);
  try {
    switch (event) {
      case "message":
        break;
      case "data":
        if (args[0] == null) {
          const data = {
            settings
          };
          sendDataToMainFn("set", data);
        } else {
          const settings2 = args[0].settings;
        }
        break;
      case "get":
        handleGet(...args);
        break;
      case "set":
        handleSet(...args);
        break;
      default:
        console.log("TEMPLATE: Unknown message:", event, ...args);
        break;
    }
  } catch (error) {
    console.error("TEMPLATE: Error in onMessageFromMain:", error);
  }
}
var handleGet = async (...args) => {
  console.log("TEMPLATE: Handling GET request", ...args);
  if (args[0] == null) {
    console.log("TEMPLATE: No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "manifest":
      response = manifest;
      sendDataToMainFn("manifest", response);
      break;
    default:
      response = `${args[0].toString()} Not implemented yet!`;
      break;
  }
  sendDataToMainFn("data", response);
};
var handleSet = async (...args) => {
  console.log("TEMPLATE: Handling SET request", ...args);
  if (args[0] == null) {
    console.log("TEMPLATE: No args provided");
    return;
  }
  let response;
  switch (args[0].toString()) {
    case "update_setting":
      if (args[1] != null) {
        const { setting, value } = args[1];
        settings[setting].value = value;
        console.log("TEMPLATE New Setting", settings);
        response = { settings };
        sendDataToMainFn("add", response);
      } else {
        console.log("TEMPLATE: No args provided", args[1]);
        response = "No args provided";
      }
      break;
    default:
      console.log("TEMPLATE: Unknown request", args[0].toString());
      response = `${args[0].toString()} Not implemented yet!`;
      break;
  }
  console.log("TEMPLATE: Response", response);
  sendDataToMainFn("data", response);
};
module.exports = { start, onMessageFromMain, stop };

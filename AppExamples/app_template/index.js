const fs = require('fs');
const path = require('path');

// This will be a function passed from the start method that will send data to the server
let sendDataToMainFn

// Your manifest data
let manifest
// Your settings
let settings = {
  "setting_example_message": { // The name of the setting
    "value": 'message1', // The current value of the setting
    "label": "Setting Example Message", // The label of this setting to be displayed
    "options": [ // An array of options for that setting
      { // Ensure you include the default data in the options
        "value": 'message1', // The value of this option
        "label": "Set to Message1" // The label of this option
      },
      {
        "value": 'message2', // The value of this option
        "label": "Set to Message2" // The label of this option
      },
    ]
  }
}

async function start({ sendDataToMain }) {
  /* CALLED ON THE APP CREATION */
  console.log('TEMPLATE: App started!')
  sendDataToMainFn = sendDataToMain;

  // Get the manifest data
  const manifestPath = path.join(__dirname, 'manifest.json');
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Get the saved data from main
  sendDataToMain('get', 'data')
}
async function stop() {
  /* HANDLE STOPPING THE APP AND ANY RUNNING PROCESSES */
  console.log('TEMPLATE: App stopping...')
  sendDataToMainFn = null
}

async function onMessageFromMain(event, ...args) {
  /* THIS IS CALLED WHENEVER THERE IS A MESSAGE FROM THE SERVER
  
  All messages should follow the format 'event' 'type' 'data' with only a few exceptions
  'event' is the type of data being passed. Whether that is actual data, or a get/set request
  'type' is usually only used when there is a request. It is what request is being made (i.e. get settings)
  'data' is the payload of the request. This will typically be an object to pull things off of but can vary

  */

  // Logging for debugging sake. Any logs are not required
  console.log(`TEMPLATE: Received event ${event} with args `, ...args)
  try {
    // Switch over the event to see what type of data there is 
    switch (event) {
      case 'message':
        // Called whenever the server is sending a message. Not usually used outside of development / testing
        break

      case 'data': // This means that the server is providing the saved data. This may be null if there is none in the server
        if (args[0] == null) {
          /* Handle sending the app data. Ensure you follow this format exactly! */
          const data = {
            settings: settings
          }
          // Sending the 'set' keyword will 'set' the settings. This will overwrite any existing data. To add to existing data, use 'add' instead
          sendDataToMainFn('set', data)
        } else {
          /* Handle setting the data from the server to a variable. The implementation here is bad, ensure that you handle it in a way that can be used in your app (either a global variable or a class are two decent options)*/
          const settings = args[0].settings
        }
        break

      /** GET / POST / PUT */
      case 'get':
        handleGet(...args) // It is a good idea to separate this out to separate concerns. This can be in either this file or another
        break
      case 'set':
        handleSet(...args)
        break
      default:
        console.log('TEMPLATE: Unknown message:', event, ...args)
        break
    }
  } catch (error) {
    console.error('TEMPLATE: Error in onMessageFromMain:', error)
  }
}

const handleGet = async (...args) => {
  console.log('TEMPLATE: Handling GET request', ...args)

  if (args[0] == null) {
    console.log('TEMPLATE: No args provided')
    return
  }

  let response // The response that will be sent 
  switch (args[0].toString()) {
    case 'manifest':
      response = manifest // Return the manifest when called
      sendDataToMainFn('manifest', response) // send data 'manifest' to server so it knows what to do with it
      break
    default:
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  sendDataToMainFn('data', response) // type 'data' will send it directly to the CarThing to handle
}
const handleSet = async (...args) => {
  console.log('TEMPLATE: Handling SET request', ...args)

  if (args[0] == null) {
    console.log('TEMPLATE: No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'update_setting': // This case will be called when the Car Thing tries and update the settings
      if (args[1] != null) {
        const {setting, value} = args[1]; // extract the new value and new setting
        settings[setting].value = value // Set the setting value to whatever the new one is (ensure that you handle the saving/usage of your settings correctly)

        console.log('TEMPLATE New Setting', settings)
        response = { settings: settings } // Send the updated settings back to the Car Thing to be displayed 
        sendDataToMainFn('add', response) // Also update the local settings on the app
      } else {
        console.log('TEMPLATE: No args provided', args[1])
        response = 'No args provided'
      }
      break
    default:
      console.log('TEMPLATE: Unknown request', args[0].toString())
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  console.log('TEMPLATE: Response', response)
  sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }

// Importing the "class" that I like to use to store all the data n whatnot. Not needed, just makes life easier
const timerHandler = require('./timer.js');

let timer

// REQUIRED - entrypoint for the server. sendDataToMain is the function you will use to send data back to the server
async function start({ sendDataToMain }) {
  // Initializing a new instance of the discord app
  timer = new timerHandler(sendDataToMain)

  // Requesting whatever data is saved in main
  sendDataToMain('get', 'data')

  // Logging
  timer.sendLog('App started successfully!')

  // Sending a message to the webapp (on the car thing)
  timer.sendDataToMainFn('data', {type: 'message', data: 'Hello from the timer app!'})
}

// REQUIRED - endpoint for the server - cleanup any listeners or functions you may have here 
async function stop() {
  timer.sendLog('App stopping...')
  /** Ensure the RPC stuff is killed (not done)*/ 
  timer = null
}
// REQUIRED - endpoint from the server (received data) - this is where you will handle any events from the main app
async function onMessageFromMain(event, ...args) {
  //Logging
  timer.sendLog(`Received event ${event} with args `, ...args)
  // Thrown in a try-catch in case there is an error
  try {
    switch (event) {
      
      case 'message':
        // Disabled for conciseness 
        break

      case 'data':
        break

      case 'callback-data':
	break

      case 'get':
        handleGet(...args)
	break

      case 'set':
        handleSet(...args)
        break
      default:
        timer.sendError('Unknown message:' + event)
        break
    }
  } catch (error) {
    
    timer.sendError('Error in onMessageFromMain:' + error)
  }
}

// Handles any 'get' messages
const handleGet = async (...args) => {

  // Ensure there is data
  if (args[0] == null) {
    timer.sendError('No args provided')
    return
  }
  // What is returned to the web app
  let response
  // Switch over the cases
  switch (args[0].toString()) {
    // REQUIRED - get manifest statement
    case 'manifest':
      // Return the manifest with the 'manifest' tag so it is treated specifically
      response = timer.manifest
      timer.sendDataToMainFn('manifest', response)
      break
    default:
      // Route any other get requests to the handleCommand in the discord class (optional)
      response = timer.handleCommand('get', ...args)
      break
  }
  // This sends whatever the structure is to the view (webapp) that corresponds with this view
  timer.sendDataToMainFn('data', response)
}

// Handling set cases from the server
const handleSet = async (...args) => {

  // Ensure data exists
  if (args[0] == null) {
    timer.sendError('No args provided')
    return
  }
  let response
  // Switch over the cases
  switch (args[0].toString()) {
    // REQUIRED - Wil be sent whenever settings are updated
    case 'update_setting':
      // Ensure they exist
      if (args[1] != null) {
        const {setting, value} = args[1];
        timer.settings[setting].value = value

        timer.sendLog('New Setting', timer.settings)
        const settings = { settings: timer.settings }
        timer.sendDataToMainFn('add', settings)
      } else {
        timer.sendError('No args provided')
        response = 'No args provided'
      }
      break
    default:
      response = timer.handleCommand('set', ...args)
      break
  }

  if (response != null) {
    timer.sendDataToMainFn('data', response)
  }
}

// REQUIRED - export these three functions
module.exports = { start, onMessageFromMain, stop }

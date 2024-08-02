// Importing the "class" that I like to use to store all the data n whatnot. Not needed, just makes life easier
const DiscordHandler = require('./discord.js');

let discord

// REQUIRED - entrypoint for the server. sendDataToMain is the function you will use to send data back to the server
async function start({ sendDataToMain }) {
  // Initializing a new instance of the discord app
  discord = new DiscordHandler(sendDataToMain)
  
  // Requesting whatever data is saved in main
  sendDataToMain('get', 'data')

  // Logging
  discord.sendLog('App started successfully!')

  // Sending a message to the webapp (on the car thing)
  discord.sendDataToMainFn('data', {type: 'message', data: 'Hello from the discord app!'})
}

// REQUIRED - endpoint for the server - cleanup any listeners or functions you may have here 
async function stop() {
  discord.sendLog('App stopping...')
  /** Ensure the RPC stuff is killed (not done)*/ 
  discord = null
}

// REQUIRED - endpoint from the server (received data) - this is where you will handle any events from the main app
async function onMessageFromMain(event, ...args) {
  //Logging
  discord.sendLog(`Received event ${event} with args `, ...args)
  // Thrown in a try-catch in case there is an error
  try {
    /**
     * Switching over the event data. It can either be:
     * 'message' a message from the server
     * 'data' any data from the server (i.e. from the file or from user requests) - needs data validation because it can be null
     * 'auth' authentication data from the server - needs data validation because it can be null
     * 'get' a request from the server to get data - needs data validation because it can be null
     * 'set' a request from the server to set data (i.e. POST or PUT data) - needs data validation because it can be null
     */
    switch (event) {
      
      case 'message':
        // Disabled for conciseness 
        break

      case 'data':
        // First checking if any of the fields are null
        if (args[0] == null || args[0].client_id == null || args[0].client_secret == null) {
          // 'get' 'auth' prompts the user for data. This is the blinky blue button. Formatting must match this structure - the name (i.e. client_id) is how it will be returned after the data is inputted
          discord.sendDataToMainFn('get', 'auth', {
            'client_id': {
              'value': '',
              'label': 'Discord Client ID',
              'instructions': 'You can get your Discord Client ID from the <a href="https://discord.com/developers/applications" target="_blank" style="color: lightblue;">Discord Application Dashboard</a>. You must create a new discord bot and then under OAuth2 find CLIENT ID - Copy and paste that into this field.',
            },
            'client_secret': {
              'value': '',
              'label': 'Discord Client Secret',
              'instructions': 'You can get your Spotify Client Secret from the <a href="https://discord.com/developers/applications" target="_blank" style="color: lightblue;">Discord Application Dashboard</a>. You must create a new application and then under OAuth2 click "Reveal Secret" or "Reset Secret" and copy-paste that here in this field.',
            },
            'redirect_url': {
              'instructions': 'Set the Discord Redirect URI to http://localhost:8888/callback/discord and then click "Save".\n This ensures you can authenticate your account to this application',
            }
          }
          )
        } else {
          // Assuming that all of that data is present, saving it to local cache
          console.log('Updating local data', ...args)

          // Double check if settings exist
          if (args[0].settings) {
            // Switch over the two settings that exist in the class
            ['notifications', 'auto_switch_view'].forEach(key => {
              if (args[0].settings?.[key]) {
                // Updating the setting
                discord.settings[key] = args[0].settings[key];
              }
            });
          }

          // Checking if there is a token (for authentication)
          if (args[0].token) {
            discord.token = args[0].token
          }
          discord.client_id = args[0].client_id
          discord.client_secret = args[0].client_secret

          // Formatting the data to send back to the server to ensure everything is updated 
          const data = {
            client_id: discord.client_id,
            client_secret: discord.client_secret,
            settings: discord.settings,
            token: discord.token,
          }
          // Send the updated data back to the server
          discord.sendDataToMainFn('add', data)

          // Attempt to login with discord (for auth)
          discord.login()
        }
        break

      // 'callback-data' is data returned from an OAuth flow
      case 'callback-data':
        if (args[0] == null) {
          discord.sendDataToMainFn('get')
        } else {
          const code = args[0].code
          const response = await post('https://discord.com/api/oauth2/token', {
            client_id: discord.client_id,
            client_secret: discord.client_secret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: discord.redirect_url,
        });
          discord.response = response.data
          console.log("Discord Auth Response: ", discord.response)
          const returnData = {
            settings: discord.settings,
            client_id: discord.client_id,
            client_secret: discord.client_secret,
          }
          discord.sendDataToMainFn('add', returnData)
        }
        break
      /** GET / POST / PUT */
      case 'get':
        handleGet(...args)
        break
      case 'set':
        handleSet(...args)
        break
      default:
        discord.sendError('Unknown message:' + event)
        break
    }
  } catch (error) {
    
    discord.sendError('Error in onMessageFromMain:' + error)
  }
}

// Handles any 'get' messages
const handleGet = async (...args) => {

  // Ensure there is data
  if (args[0] == null) {
    discord.sendError('No args provided')
    return
  }
  // What is returned to the web app
  let response
  // Switch over the cases
  switch (args[0].toString()) {
    // REQUIRED - get manifest statement
    case 'manifest':
      // Return the manifest with the 'manifest' tag so it is treated specifically
      response = discord.manifest
      discord.sendDataToMainFn('manifest', response)
      break
    default:
      // Route any other get requests to the handleCommand in the discord class (optional)
      response = discord.handleCommand('get', ...args)
      break
  }
  // This sends whatever the structure is to the view (webapp) that corresponds with this view
  discord.sendDataToMainFn('data', response)
}

// Handling set cases from the server
const handleSet = async (...args) => {

  // Ensure data exists
  if (args[0] == null) {
    discord.sendError('No args provided')
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
        discord.settings[setting].value = value

        discord.sendLog('New Setting', discord.settings)
        const settings = { settings: discord.settings }
        discord.sendDataToMainFn('add', settings)
      } else {
        discord.sendError('No args provided')
        response = 'No args provided'
      }
      break
    default:
      response = discord.handleCommand('set', ...args)
      break
  }

  if (response != null) {
    discord.sendDataToMainFn('data', response)
  }
}

// REQUIRED - export these three functions
module.exports = { start, onMessageFromMain, stop }

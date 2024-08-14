const DiscordHandler = require('./discord.js');
const Deskthing = require('deskthing-app-client').default

let discord

const deskthing = new Deskthing()

deskthing.sendMessage('hello')

async function start({ sendDataToMain }) {
  discord = new DiscordHandler(sendDataToMain)
  
  // Get the data from main
  sendDataToMain('get', 'data')
  discord.sendLog('App started successfully!')
  discord.sendDataToMainFn('data', {type: 'message', data: 'Hello from the discord app!'})
}
async function stop() {
  discord.sendLog('App stopping...')
  /** Ensure the RPC stuff is killed */
  discord = null
}

async function onMessageFromMain(event, ...args) {
  discord.sendLog(`Received event ${event} with args `, ...args)
  try {
    switch (event) {
      case 'message':
        // Disabled for conciseness 
        break

      case 'data':
        // New Application Case
        if (args[0] == null || args[0].client_id == null || args[0].client_secret == null) {
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
          // Update settings if they exist
          console.log('Updating local data', ...args)
          if (args[0].settings) {
            ['notifications', 'auto_switch_view'].forEach(key => {
              if (args[0].settings?.[key]) {
                discord.settings[key] = args[0].settings[key];
              }
            });
          }
          if (args[0].token) {
            discord.token = args[0].token
          }
          const data = {
            client_id: args[0].client_id,
            client_secret: args[0].client_secret,
            settings: discord.settings,
            token: discord.token,
          }
          // Update client_id and client_secret
          discord.client_id = data.client_id
          discord.client_secret = data.client_secret
          discord.sendDataToMainFn('add', data)
          discord.registerRPC(data.client_id) // Also logs in the user and is the main entrypoint
        }
        break
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

const handleGet = async (...args) => {

  if (args[0] == null) {
    discord.sendError('No args provided')
    return
  }

  let response
  switch (args[0].toString()) {
    case 'manifest':
      response = discord.manifest
      discord.sendDataToMainFn('manifest', response)
      break
    default:
      response = discord.handleCommand('get', ...args)
      break
  }
  discord.sendDataToMainFn('data', response)
}
const handleSet = async (...args) => {

  if (args[0] == null) {
    discord.sendError('No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'update_setting':
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
module.exports = { start, onMessageFromMain, stop }

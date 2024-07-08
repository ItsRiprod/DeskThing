const SpotifyHandler = require('./spotify.js')

let spotify

async function start({ sendDataToMain }) {
  spotify = new SpotifyHandler(sendDataToMain)
  // Get the data from main
  sendDataToMain('get', 'data')
  spotify.sendLog('Successfully Started!')
}
async function stop() {
  
  spotify.sendLog('Successfully Stopped!')
  
  spotify = null
}

async function onMessageFromMain(event, ...args) {
  spotify.sendLog(`Received event ${event}`)
  try {
    switch (event) {
      case 'message':
        break

      /** AUTHORIZATION CASES */

      case 'data':
        // Check if there is data
        if (args[0] == null || !args[0].Spotify_API_Id) {
          // If there is no environment data, request the environment data
          spotify.sendDataToMainFn('get', 'auth', [
            'Spotify_API_Id',
            'Spotify_Client_Secret'
          ])
        } else if (args[0].Spotify_Refresh_Token) {
          spotify.sendLog('Refreshing token...')
          spotify.refresh_token = args[0].Spotify_Refresh_Token
          spotify.client_id = args[0].Spotify_API_Id
          spotify.client_secret = args[0].Spotify_Client_Secret
          if (args[0].Spotify_Access_Token) {
            spotify.access_token = args[0].Spotify_Access_Token || undefined
          }

          await spotify.refreshAccessToken()
        } else {
          const data = {
            Spotify_API_Id: args[0].Spotify_API_Id,
            Spotify_Client_Secret: args[0].Spotify_Client_Secret,
            Spotify_Refresh_Token: spotify.refresh_token || undefined,
            Spotify_Access_Token: spotify.access_token || undefined,
          }

          // Also tell the database to set the data
          spotify.sendDataToMainFn('set', data)
          spotify.client_id = data.Spotify_API_Id
          spotify.client_secret = data.Spotify_Client_Secret

          spotify.sendError('No refresh token found, logging in...')
          await spotify.login()
        }

        if (args[0].settings) {
          spotify.settings = args[0].settings
        } else {
          const settings = { settings: spotify.settings }
          spotify.sendDataToMainFn('add', settings)
        }
        break
      case 'auth-data':
        spotify.sendError('Something went wrong! You shouldnt be here!')
        //spotify.sendDataToMainFn('add', { Spotify_Refresh_Token: args[0].code })
        //console.log('New Refresh Token: ', args[0].code)
        //spotify.refresh_token = args[0].code

        break
      case 'callback-data':
        if (args[0] == null) {
          spotify.sendDataToMainFn('get')
        } else {
          const returnData = await spotify.getAccessToken(args[0].code)
          spotify.sendDataToMainFn('add', returnData)
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
        spotify.sendError(`Unknown Message received ${event} ${args[0]}`)
        break
    }
  } catch (error) {
    spotify.sendError('Error in onMessageFromMain:' + error)
  }
}

const handleGet = async (...args) => {

  if (args[0] == null) {
    spotify.sendError('No args provided!')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'song':
      response = await spotify.returnSongData()
      break
    case 'manifest':
      response = spotify.manifest
      spotify.sendDataToMainFn('manifest', response)
      break
    default:
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  spotify.sendDataToMainFn('data', response)
}
const handleSet = async (...args) => {

  if (args[0] == null) {
    spotify.sendError('No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'next':
      response = await spotify.next(args[1])
      break
    case 'previous':
      response = await spotify.previous()
      break
    case 'fast_forward':
      response = await spotify.fastForward(args[1])
      break
    case 'rewind':
      response = await spotify.rewind(args[1])
      break
    case 'play':
      response = await spotify.play(args[1])
      break
    case 'pause':
    case 'stop':
      response = await spotify.pause()
      break
    case 'seek':
      response = await spotify.seek(args[1])
      break
    case 'like':
      response = await spotify.like(args[1])
      break
    case 'volume':
      response = await spotify.volume(args[1])
      break
    case 'repeat':
      response = await spotify.repeat(args[1])
      break
    case 'shuffle':
      response = await spotify.shuffle(args[1])
      break
      case 'update_setting':
        if (args[1] != null) {
          const {setting, value} = args[1];
          spotify.settings[setting].value = value
  
          spotify.sendLog('New Settings:' + spotify.settings)
          response = { settings: spotify.settings }
          spotify.sendDataToMainFn('add', response)
        } else {
          spotify.sendLog('No args provided', args[1])
          response = 'No args provided'
        }
        break
  }
  spotify.sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }

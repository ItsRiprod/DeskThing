import SpotifyHandler from './spotify'
import { DeskThing as DK, IncomingData } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }


let spotify: SpotifyHandler

const start = async () => {
  spotify = new SpotifyHandler()

  DeskThing.on('get', handleGet)
  DeskThing.on('set', handleSet)

  DeskThing.on('callback-data', handleCallbackData)
}

const handleCallbackData = async (data: IncomingData) => {
  if (data.payload == null) {
    DeskThing.sendError('Unable to get access token')
  } else {
    await spotify.getAccessToken(data.payload)
  }
}

const handleGet = async (data: IncomingData) => {

  if (data.type == null) {
    DeskThing.sendError('No args provided!')
    return
  }
  switch (data.request) {
    case 'song':
      await spotify.returnSongData()
      break
    case 'refresh':
      await spotify.checkForRefresh()
      break
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`)
      break
    // Handle other types ?
  }
}
const handleSet = async (data: IncomingData) => {

  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  let response
  switch (data.request) {
    case 'next':
      response = await spotify.next(data.payload)
      break
    case 'previous':
      response = await spotify.previous()
      break
    case 'fast_forward':
      response = await spotify.fastForward(data.payload)
      break
    case 'rewind':
      response = await spotify.rewind(data.payload)
      break
    case 'play':
      response = await spotify.play(data.payload)
      break
    case 'pause':
    case 'stop':
      response = await spotify.pause()
      break
    case 'seek':
      response = await spotify.seek(data.payload)
      break
    case 'like':
      response = await spotify.like(data.payload)
      break
    case 'volume':
      response = await spotify.volume(data.payload)
      break
    case 'repeat':
      response = await spotify.repeat(data.payload)
      break
    case 'shuffle':
      response = await spotify.shuffle(data.payload)
      break
    case 'transfer':
      response = await spotify.transfer()
      break
  }
  DeskThing.sendLog(response)
}

DeskThing.on('start', start)

/*
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

      // AUTHORIZATION CASES 

      case 'data':
        // Check if there is data
        if (args[0] == null || !args[0].Spotify_API_Id) {
          // If there is no environment data, request the environment data
          spotify.sendDataToMainFn('get', 'auth', {
            'Spotify_API_Id': {
              'value': '',
              'label': 'Spotify Client ID',
              'instructions': 'You can get your Spotify Client ID from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "Client ID" Copy and paste that into this field.',
            },
            'Spotify_Client_Secret': {
              'value': '',
              'label': 'Spotify Client Secret',
              'instructions': 'You can get your Spotify Client Secret from the <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: lightblue;">Spotify Developer Dashboard</a>. You must create a new application and then under "View Client Secret", Copy and paste that into this field.',
            },
            'Spotify_Redirect_URI': {
              'instructions': 'Set the Spotify Redirect URI to http://localhost:8888/callback/spotify and then click "Save".\n This ensures you can authenticate your account to this application',
            }
          }
          )
        } else if (args[0].Spotify_Refresh_Token) {
          spotify.sendLog('Refreshing token...')
          spotify.client_id = args[0].Spotify_API_Id
          spotify.client_secret = args[0].Spotify_Client_Secret
          if (args[0].Spotify_Access_Token) {
            spotify.access_token = args[0].Spotify_Access_Token || undefined
          }
          if (args[0].Spotify_Refresh_Token != undefined) {
            spotify.refresh_token = args[0].Spotify_Refresh_Token || undefined
          }

          await spotify.refreshAccessToken()
        } else {
          const data = {
            Spotify_API_Id: args[0].Spotify_API_Id,
            Spotify_Client_Secret: args[0].Spotify_Client_Secret
          }

          // Also tell the database to set the data
          spotify.sendDataToMainFn('add', data)
          spotify.client_id = data.Spotify_API_Id
          spotify.client_secret = data.Spotify_Client_Secret

          spotify.sendError('No refresh token found, logging in...')
          await spotify.login()
        }

        ['refresh_interval', 'output_device', 'change_source'].forEach(key => {
          if (args[0].settings?.[key]) {
            spotify.settings[key] = args[0].settings[key];
          } else {
            const settings = { settings: spotify.settings };
            spotify.sendDataToMainFn('add', settings);
          }
        });
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

      // GET / POST / PUT 
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
    case 'transfer':
      response = await spotify.transfer()
      break
    case 'update_setting':
      if (args[1] != null) {
        const { setting, value } = args[1];
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
*/
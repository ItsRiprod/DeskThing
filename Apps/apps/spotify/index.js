const SpotifyHandler = require('./spotify.js')

let spotify

async function start({ sendDataToMain }) {
  console.log('App started!')
  spotify = new SpotifyHandler(sendDataToMain)

  // Get the data from main
  sendDataToMain('get', 'data')
}
async function stop() {
  console.log('Spotify App stopping...')
}

async function onMessageFromMain(event, ...args) {
  console.log(`SPOTIFY: Received event ${event} with args `, ...args)
  try {
    switch (event) {
      case 'message':
        console.log('SPOTIFY: Received message:', ...args)
        break

      /** AUTHORIZATION CASES */

      case 'data':
        // Check if there is data
        if (args[0] == null || !args[0].Spotify_API_Id) {
          // If there is no environment data, request the environment data
          spotify.sendDataToMainFn('get', 'auth', [
            'Spotify_API_Id',
            'Spotify_Client_Secret',
            'Device_Id'
          ])
        } else if (args[0].Spotify_Refresh_Token) {
          console.log('SPOTIFY: Refreshing token...')
          spotify.refresh_token = args[0].Spotify_Refresh_Token
          spotify.client_id = args[0].Spotify_API_Id
          spotify.client_secret = args[0].Spotify_Client_Secret
          spotify.device_id = args[0].Device_Id
          spotify.access_token = args[0].Spotify_Access_Token || undefined

          await spotify.refreshAccessToken()
        } else {
          const data = {
            Spotify_API_Id: args[0].Spotify_API_Id,
            Spotify_Client_Secret: args[0].Spotify_Client_Secret,
            Device_Id: args[0].Device_Id,
            Spotify_Refresh_Token: spotify.refresh_token || undefined,
            Spotify_Access_Token: spotify.access_token || undefined
          }

          // Also tell the database to set the data
          spotify.sendDataToMainFn('set', data)
          spotify.client_id = data.Spotify_API_Id
          spotify.client_secret = data.Spotify_Client_Secret
          spotify.device_id = data.Device_Id

          console.log('SPOTIFY: No refresh token found, logging in...')
          await spotify.login()
        }
        break
      case 'auth-data':
        spotify.sendDataToMainFn('add', { Spotify_Refresh_Token: args[0].code })
        console.log('New Refresh Token: ', args[0].code)
        spotify.refresh_token = args[0].code

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
        console.log('SPOTIFY: Unknown message:', event, ...args)
        break
    }
  } catch (error) {
    console.error('SPOTIFY: Error in onMessageFromMain:', error)
  }
}


const handleGet = async (type, ...args) => {
  console.log('SPOTIFY: Handling GET request', type, ...args)

  if (type == null) {
    console.log('SPOTIFY: No args provided')
    return
  }
  let response
  switch (type) {
    case 'song_info':
      response = await spotify.returnSongData()
      break
    case 'device_info':
      response = await spotify.returnDeviceData()
      break
    default:
      response = await spotify.returnDefaultData()
      break
  }
  spotify.sendDataToMainFn('data', response)
}
const handleSet = async (...args) => {
  console.log('SPOTIFY: Handling SET request', ...args)

  if (args[0] == null) {
    console.log('SPOTIFY: No args provided')
    return
  }
  let response
  console.log(args[0].toString())
  switch (args[0].toString()) {
    case 'set_vol':
      response = await spotify.setVolume(args[1])
      break
    case 'set_shuffle':
      response = await spotify.setShuffle(args[1])
      break
    case 'set_repeat':
      response = await spotify.setRepeat(args[1])
      break
    case 'next_track':
      console.log('SPOTIFY: Skipping to next track')
      response = await spotify.skipToNext(args[1])
      break
    case 'previous_track':
      response = await spotify.skipToPrev(args[1])
      break
    case 'pause_track':
    case 'stop_track':
      response = await spotify.pause()
      break
    case 'seek_track':
      response = await spotify.seek(args[1])
      break
    case 'play_track':
      response = await spotify.play()
      break
  }
  spotify.sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }

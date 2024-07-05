const MediaWinHandler = require('./mediawin.js')

let mediawin

async function start({ sendDataToMain }) {
  console.log('MediaWin App started!')
  mediawin = new MediaWinHandler(sendDataToMain)
  // Get the data from main
  sendDataToMain('get', 'data')
  mediawin.sendLog('Successfully Started!')
}
async function stop() {
  console.log('MediaWin App stopping...')

  mediawin.sendLog('Successfully Stopped!')

  mediawin = null
}

async function onMessageFromMain(event, ...args) {
  console.log(`MEDIAWIN: Received event ${event} with args `, ...args)
  try {
    switch (event) {
      case 'message':
        break

      /** AUTHORIZATION CASES */

      case 'data':

        if (args[0].settings) {
          mediawin.settings = args[0].settings
        } else {
          const settings = { settings: mediawin.settings }
          mediawin.sendDataToMainFn('add', settings)
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
        console.log('MEDIAWIN: Unknown message:', event, ...args)
        mediawin.sendError(`Unknown Message received ${event} ${args[0]}`)
        break
    }
  } catch (error) {
    console.error('MEDIAWIN: Error in onMessageFromMain:', error)
  }
}

const handleGet = async (...args) => {
  console.log('MEDIAWIN: Handling GET request', ...args)

  if (args[0] == null) {
    console.log('MEDIAWIN: No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'song_info':
      response = await mediawin.returnSongData()
      mediawin.sendDataToMainFn('data', { type: 'song_data', data: response })
      break
      case 'device_info':
        response = await mediawin.returnSongData()
        mediawin.sendDataToMainFn('data', { type: 'device_data', data: response })
      break
    case 'manifest':
      response = mediawin.manifest
      mediawin.sendDataToMainFn('manifest', response)
      break
    default:
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  mediawin.sendDataToMainFn('data', response)
}
const handleSet = async (...args) => {
  console.log('MEDIAWIN: Handling SET request', ...args)

  if (args[0] == null) {
    console.log('MEDIAWIN: No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'set_vol':
      response = await mediawin.setVolume(args[1])
      break
    case 'set_shuffle':
      response = await mediawin.setShuffle(args[1])
      break
    case 'set_repeat':
      response = await mediawin.setRepeat(args[1])
      break
    case 'next_track':
      response = await mediawin.skipToNext(args[1])
      response = await mediawin.returnSongData()
      mediawin.sendDataToMainFn('data', { type: 'song_data', data: response })
      mediawin.sendDataToMainFn('data', { type: 'device_data', data: response })
      break
    case 'previous_track':
      response = await mediawin.skipToPrev(args[1])
      response = await mediawin.returnSongData()
      mediawin.sendDataToMainFn('data', { type: 'song_data', data: response })
      mediawin.sendDataToMainFn('data', { type: 'device_data', data: response })
      break
    case 'pause_track':
    case 'stop_track':
      response = await mediawin.pause()
      break
    case 'seek_track':
      response = await mediawin.seek(args[1])
      break
    case 'play_track':
      response = await mediawin.play()
      response = await mediawin.returnSongData()
      mediawin.sendDataToMainFn('data', { type: 'song_data', data: response })
      mediawin.sendDataToMainFn('data', { type: 'device_data', data: response })
      break
    case 'update_setting':
      if (args[1] != null) {
        const { setting, value } = args[1];
        mediawin.settings[setting].value = value

        console.log('MEDIAWIN New Setting', mediawin.settings)
        response = { settings: mediawin.settings }
        mediawin.sendDataToMainFn('add', response)
      } else {
        console.log('MEDIAWIN: No args provided', args[1])
        response = 'No args provided'
      }
      break
  }
  mediawin.sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }

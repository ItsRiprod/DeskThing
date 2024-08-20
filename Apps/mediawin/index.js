import MediaWinHandler from './mediawin.js'
import { DeskThing as DK } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }

let mediawin

const start = async () => {
  mediawin = new MediaWinHandler(DeskThing)

  let Data = await DeskThing.getData()
  DeskThing.on('data', (newData) => {
    Data = newData
  })

  if (!Data.settings?.change_source) {
    const settings = {
      "change_source": {
        "value": 'true',
        "label": "Switch Output on Select",
        "options": [
          {
            "value": "true",
            "label": "Switch"
          },
          {
            "value": "false",
            "label": "Dont Switch"
          }
        ]
      },
    }
    DeskThing.addSettings(settings)
  }

  DeskThing.on('get', handleGet)
  DeskThing.on('set', handleSet)
}

DeskThing.on('start', start)


const handleGet = async (data) => {
  console.log('Receiving Get Data', data)
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  let response
  switch (data.request) {
    case 'song':
      response = await mediawin.returnSongData()
      response = { app: 'client', type: 'song', payload: response }
      DeskThing.sendDataToClient(response)
      break
    case 'refresh':
      response = await mediawin.checkForRefresh()
      if (response) {
        response = { app: 'client', type: 'song', payload: response }
        DeskThing.sendDataToClient(response)
      }
      break
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`)
      break
  }
}

const handleSet = async (data) => {
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  DeskThing.sendLog('Receiving Set Data' + data)
  console.log('Receiving Set Data', data)
  let response
  switch (data.request) {
    case 'next':
      response = await mediawin.next(data.payload)
      if (!response == false) {
        response = { app: 'client', type: 'song', payload: response }
        DeskThing.sendDataToClient(response)
      }
      break
    case 'previous':
      response = await mediawin.previous()
      break
    case 'fast_forward':
      response = await mediawin.fastForward(data.payload)
      break
    case 'rewind':
      response = await mediawin.rewind(data.payload)
      break
    case 'play':
      response = await mediawin.play(data.payload)
      break
    case 'pause':
    case 'stop':
      response = await mediawin.pause()
      break
    case 'seek':
      response = await mediawin.seek(data.payload)
      break
    case 'like':
      response = 'Unable to like songs!'
      break
    case 'volume':
      response = await mediawin.volume(data.payload)
      break
    case 'repeat':
      response = await mediawin.repeat(data.payload)
      break
    case 'shuffle':
      response = await mediawin.shuffle(data.payload)
      break
  }
}

/*
async function start({ sendDataToMain }) {
  mediawin = new MediaWinHandler(sendDataToMain)
  // Get the data from main
  sendDataToMain('get', 'data')
  mediawin.sendLog('Successfully Started!')
}
async function stop() {

  mediawin.sendLog('Successfully Stopped!')

  mediawin = null
}

async function onMessageFromMain(event, ...args) {
  mediawin.sendLog(`MEDIAWIN: Received event ${event}`)
  try {
    switch (event) {
      case 'message':
        break

      // AUTHORIZATION CASES

      case 'data':

        if (args[0]?.settings != null) {
          ['refresh_interval', 'output_device', 'change_source'].forEach(key => {
            if (args[0].settings?.[key]) {
              spotify.settings[key] = args[0].settings[key];
            } else {
              const settings = { settings: spotify.settings };
              spotify.sendDataToMainFn('add', settings);
            }
          });
        } else {
          const settings = { settings: mediawin.settings }
          mediawin.sendDataToMainFn('add', settings)
        }
        break
      /// GET / POST / PUT
      case 'get':
        handleGet(...args)
        break
      case 'set':
        handleSet(...args)
        break
      default:
        mediawin.sendError(`Unknown Message received ${event} ${args[0]}`)
        break
    }
  } catch (error) {
    mediawin.sendError('Error in onMessageFromMain:', error)
  }
}

const handleGet = async (...args) => {

  if (args[0] == null) {
    mediawin.sendError('No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'song':
      response = await mediawin.returnSongData()
      response = { app: 'client', type: 'song', data: response }
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
  if (args[0] == null) {
    mediawin.sendError('No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'next':
      response = await mediawin.next(args[1])
      if (!response == false) {
        response = { app: 'client', type: 'song', data: response }
      }
      break
    case 'previous':
      response = await mediawin.previous()
      break
    case 'fast_forward':
      response = await mediawin.fastForward(args[1])
      break
    case 'rewind':
      response = await mediawin.rewind(args[1])
      break
    case 'play':
      response = await mediawin.play(args[1])
      break
    case 'pause':
    case 'stop':
      response = await mediawin.pause()
      break
    case 'seek':
      response = await mediawin.seek(args[1])
      break
    case 'like':
      response = 'Unable to like songs!'
      break
    case 'volume':
      response = await mediawin.volume(args[1])
      break
    case 'repeat':
      response = await mediawin.repeat(args[1])
      break
    case 'shuffle':
      response = await mediawin.shuffle(args[1])
      break
    case 'update_setting':
      if (args[1] != null) {
        const { setting, value } = args[1];
        mediawin.settings[setting].value = value

        mediawin.sendLog('MEDIAWIN New Setting', mediawin.settings)
        response = { settings: mediawin.settings }
        mediawin.sendDataToMainFn('add', response)
      } else {
        response = 'No args provided'
      }
      break
  }
  mediawin.sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }
*/
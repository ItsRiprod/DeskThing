const UtilityHandler = require('./utility.js')

let utility
const listeners = []

async function start({ sendDataToMain, sysEvents }) {
  console.log('UTILITY: App started!')
  utility = new UtilityHandler(sendDataToMain)

  sysEvents = sysEvents
  const removeConfigListener = sysEvents('config', handleConfigEvent)
  listeners.push(removeConfigListener)
  
  // Get the data from main
  sendDataToMain('get', 'data')
  sendLog('App started successfully!')
}
async function stop() {
  sendLog('App stopping...')

  listeners.forEach(removeListener => removeListener())
  listeners.length = 0
  utility = null
}

const handleConfigEvent = async () => {
  sendLog('Handling Config Event')
  
  // When the config changes, request the audiosources config item to update the audio sources
  utility.sendDataToMainFn('get', 'config', 'audiosources')
}

const sendLog = (message) => {
  utility.sendDataToMainFn('log', message)
}
const sendError = (message) => {
  utility.sendDataToMainFn('error', message)
}

async function onMessageFromMain(event, ...args) {
  sendLog(`Received event ${event} with args `, ...args)
  try {
    switch (event) {
      case 'message':
        // Disabled for conciseness 
        break

      case 'data':
        if (args[0] == null) {
          const data = {
            settings: utility.settings
          }
          utility.sendDataToMainFn('set', data)
        } else {
          utility.settings = args[0].settings
          utility.sendDataToMainFn('get', 'config', 'audiosources')
        }
        break
      case 'config':
        if (args[0] == undefined) {
          console.log('UTILITY: Unknown config data received')
        } else {
          if (args[0].audiosources) {
            const sources = []
            
            args[0].audiosources.map(value => {
              sources.push({
                label: value,
                value: value
              })
            })
            
            utility.settings.playback_location.options = sources

            const data = {
              settings: utility.settings
            }
            utility.sendDataToMainFn('set', data)

          }
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
        console.log('UTILITY: Unknown message:', event, ...args)
        break
    }
  } catch (error) {
    
    console.error('UTILITY: Error in onMessageFromMain:', error)
    sendError('Error in onMessageFromMain:', error)
  }
}

const handleGet = async (...args) => {
  console.log('UTILITY: Handling GET request', ...args)

  if (args[0] == null) {
    console.log('UTILITY: No args provided')
    return
  }

  let response
  switch (args[0].toString()) {
    case 'manifest':
      response = utility.manifest
      utility.sendDataToMainFn('manifest', response)
      break
    default:
      response = utility.handleCommand('get', ...args)
      break
  }
  utility.sendDataToMainFn('data', response)
}
const handleSet = async (...args) => {
  console.log('UTILITY: Handling SET request', ...args)

  if (args[0] == null) {
    console.log('UTILITY: No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'update_setting':
      if (args[1] != null) {
        const {setting, value} = args[1];
        utility.settings[setting].value = value

        console.log('UTILITY New Setting', utility.settings)
        response = { settings: utility.settings }
        utility.sendDataToMainFn('add', response)
      } else {
        console.log('UTILITY: No args provided', args[1])
        response = 'No args provided'
      }
      break
    default:
      response = utility.handleCommand('set', ...args)
      break
  }
  console.log('UTILITY: Response', response)
  utility.sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }

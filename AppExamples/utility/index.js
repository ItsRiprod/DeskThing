const UtilityHandler = require('./utility.js')

let utility

async function start({ sendDataToMain }) {
  console.log('UTILITY: App started!')
  utility = new UtilityHandler(sendDataToMain)

  // Get the data from main
  sendDataToMain('get', 'data')
}
async function stop() {
  console.log('UTILITY: App stopping...')
  utility = null
}

async function onMessageFromMain(event, ...args) {
  console.log(`UTILITY: Received event ${event} with args `, ...args)
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
    default:
      response = `${args[0].toString()} Not implemented yet!`
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
      console.log('UTILITY: Unknown request', args[0].toString())
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  console.log('UTILITY: Response', response)
  utility.sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }

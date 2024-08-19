import DiscordHandler from './discord'
import { DeskThing as DK, SocketData } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }

let discord: DiscordHandler

const main = async () => {
  // Set Data object and ensure it is up-to-date
  let data = await DeskThing.getData()
  DeskThing.on('data', (newData) => {
    data = newData
  })

  // Initialize settings
  if (!data?.settings?.auto_switch_view || !data.settings?.notifications || !data.settings?.activity) {
    DeskThing.addSettings({
      "auto_switch_view": { label: "Auto Switch View", value: true, options: [{ label: 'Disabled', value: false }, { label: 'Enabled', value: true }] },
      "notifications": { label: "Show Notifications", value: true, options: [{ label: 'Disabled', value: false }, { label: 'Enabled', value: true }] },
      "activity": { label: "Display Activity", value: true, options: [{ label: 'Disabled', value: false }, { label: 'Enabled', value: true }] }
    })
  }
  // Check if data exists 
  if (!data?.client_id || !data?.client_secret) {
    const requestScopes = {
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
        'label': 'Discord Redirect URI',
        'value': 'http://localhost:8888/callback/discord',
        'instructions': 'Set the Discord Redirect URI to http://localhost:8888/callback/discord and then click "Save".\n This ensures you can authenticate your account to this application',
      }
    }

    DeskThing.getUserInput(requestScopes, async (data) => {
      console.log('Data Response', data)
      if (data.payload.client_id && data.payload.client_secret) {
        DeskThing.saveData(data.payload)
        discord = new DiscordHandler(DeskThing)
        await discord.registerRPC()
      } else {
        DeskThing.sendError('Please fill out all the fields! Restart Discord to try again')
      }
    })
  } else {
    DeskThing.sendLog('Data Exists!')
    discord = new DiscordHandler(DeskThing)
    await discord.registerRPC()
  }


  DeskThing.on('set', handleSet)
  DeskThing.on('get', handleGet)
  
  console.log('Finished starting discord v0.8.0')
}

const handleSet = (data: SocketData) => {
  if (data == null) {
    discord.sendError('No args provided')
    return
  }
  switch(data.request) {
    case 'call':
      discord.leaveCall()
      break
    case 'mic':
      discord.setVoiceSetting({mute: data.payload || false})
      break
    case 'deafened':
      discord.setVoiceSetting({deaf: data.payload || false})
      break
    default:
      DeskThing.sendError('Set not implemented yet! Received: ' + data)
      break
  }


}
const handleGet = (data: SocketData) => {
  if (data == null) {
    discord.sendError('No args provided')
    return
  }
  if (data.request === 'call') {
    if (discord && discord.connectedUsers.length > 0) {
      discord.sendDataToClients(discord.connectedUsers, 'call')
    }
  }

  DeskThing.sendError('Set not implemented yet! Received: ' + data)

}


// Start the DeskThing
DeskThing.on('start', main)


DeskThing.on('stop', () => {
  console.log('Stopping DeskThing')
  if (discord) {
    discord.unsubscribe()
  }
})

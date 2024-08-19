import { Console } from 'console'
import { DeskThing as DK} from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }

const main = async () => {
  let Data = await DeskThing.getData()
  DeskThing.on('data', (data) => {
    Data = data
  })
  
  if (!Data.settings.playback_location) {
    DeskThing.addSettings({
      playback_location: {
        value: 'local',
        label: 'Playback Location',
        options: [
          {
            value: 'local',
            label: 'Local'
          }
        ]
      },
      refresh_interval: {
        value: 30000,
        label: "Refresh interval",
        options: [
          {
            value: 0,
            label: "Disabled"
          },
          {
            value: 5000,
            label: "5 seconds"
          },
          {
            value: 30000,
            label: "30 seconds"
          },
        ]
      },
    })
  }
  
  const handleGet = async (data) => {
    console.log('UTILITY LOG: Handling Get Event', data, Data)
    console.log('Sending data to ', Data.settings.playback_location.value, data.type, data.request, data.payload)
    DeskThing.sendDataToOtherApp(Data.settings.playback_location.value, {type: data.type, request: data.request, payload: data.payload})
  }
  DeskThing.on('get', handleGet)
  
  const handleSet = async (data) => {
    console.log('UTILITY LOG: Handling Set Event', data, Data)
    console.log('Sending data to ', Data.settings.playback_location.value, data.request, data.payload)
    DeskThing.sendDataToOtherApp(Data.settings.playback_location.value, {type: data.type, request: data.request, payload: data.payload})
  }
  DeskThing.on('set', handleSet)
  
  const handleConfigEvent = async (data = null) => {
    console.log('UTILITY LOG: Handling Config Event', data)
    let configData = data.payload
    // Check if null
    if (configData == null) {
      configData = await DeskThing.getConfig('audiosources')
      // Check again after getting more 
      if (configData == null) {
        DeskThing.sendError('No config data found')
        return
      }
    }

    DeskThing.sendLog('Handling Config Event')
    const sources = []
    console.log(configData)

    configData.audiosources.map(value => {
      sources.push({
        label: value,
        value: value
      })
      })

    Data.settings.playback_location.options = sources
    
    DeskThing.addSetting(Data.settings.playback_location)

  }
  DeskThing.onSystem('config', handleConfigEvent)
  handleConfigEvent()
  


  let refreshFunction = null
  const updateRefreshLoop = () => {
    // Clear the last loop
    if (refreshFunction) {
      console.log('Clearing refresh loop')
      refreshFunction()
    }
    console.log('Starting refresh loop')
    refreshFunction = DeskThing.addBackgroundTaskLoop(async () => {
      if (Data.settings?.refresh_interval && Data.settings.refresh_interval.value != 0) {
        DeskThing.sendLog('Refreshing data!')
        DeskThing.sendDataToOtherApp(Data.settings.playback_location.value, {type: 'get', request: 'song', payload: ''})
        setTimeout(refreshFunction, Data.settings?.refresh_interval.value)
        return false
      } else {
        DeskThing.sendLog('Refresh interval disabled')
        return true
      }
    })
  }
  const handleSettings = async (newSettings) => {
    if (Data.settings?.refresh_interval && newSettings.refresh_interval && Data.settings.refresh_interval.value != newSettings.refresh_interval.value) {
      console.log('New Timeout Interval')
      updateRefreshLoop()
    }

  }

  DeskThing.on('settings', handleSettings)
  // Start the loop
  updateRefreshLoop()
}

DeskThing.on('start', main)
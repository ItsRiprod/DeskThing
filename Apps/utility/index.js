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
            value: 10000,
            label: "10 seconds"
          },
          {
            value: 30000,
            label: "30 seconds"
          },
          {
            value: 60000,
            label: "1 minute"
          },
          {
            value: 300000,
            label: "5 minutes"
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
    let configData = data?.payload
    // Check if null
    if (configData == null) {
      configData = {}
      configData[audiosources] = await DeskThing.getConfig('audiosources')
      // Check again after getting more 
      if (!configData) {
        DeskThing.sendError('No config data found')
        return
      }
    }

    DeskThing.sendLog('Handling Config Event')
    const sources = []
    console.log('Actual config data', configData)

    configData.audiosources.map(value => {
      sources.push({
        label: value,
        value: value
      })
      })
      if (!sources) {
        DeskThing.sendError('No sources found')
        return
      }
    Data.settings.playback_location.options = sources
    console.log('UTILITY LOG: Updated playback_location options', Data.settings )
    DeskThing.addSettings({ playback_location: Data.settings.playback_location })
  }
  DeskThing.onSystem('config', handleConfigEvent)
  handleConfigEvent()
  

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  // Refresh loop
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
        try {
          DeskThing.sendLog('Refreshing data! ' + Data.settings.refresh_interval.value)
          DeskThing.sendDataToOtherApp(Data.settings.playback_location.value, {type: 'get', request: 'refresh', payload: ''})
          await sleep(Data.settings.refresh_interval.value);
          console.log('Finished sleeping. Sending another request!')
          return false
        } catch (ex) {
          DeskThing.sendError('Error refreshing data' + ex)
          return true
        }
      } else {
        DeskThing.sendLog('Refresh interval disabled')
        return true
      }
    })
  }
  let lastInterval = 0
  const handleSettings = async (newSettings) => {
    console.log('Handling Settings', newSettings)
    if (newSettings.refresh_interval && lastInterval != newSettings.refresh_interval.value) {
      console.log('New Timeout Interval')
      lastInterval = newSettings.refresh_interval.value
      updateRefreshLoop()
    }

  }

  DeskThing.on('settings', handleSettings)
  // Start the loop
  updateRefreshLoop()
}

DeskThing.on('start', main)
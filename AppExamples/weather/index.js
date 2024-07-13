const fs = require('fs');
const path = require('path');
const axios = require('axios')
const get = axios.get;
// This will be a function passed from the start method that will send data to the server
let sendDataToMainFn

// Your manifest data
let manifest
// Your settings
let settings = {
  "refresh_interval": { 
    "value": '0.5', 
    "label": "Refresh Interval", 
    "options": [
      { 
        "value": '0.25',
        "label": "15 Min" 
      },
      { 
        "value": '0.5',
        "label": "0.5 Hours" 
      },
      {
        "value": '1', 
        "label": "1 Hour" 
      },
    ]
  },
  "unit_type": { 
    "value": 'f', 
    "label": "Temperature Unit",
    "options": [ 
      { 
        "value": 'f', 
        "label": "Fahrenheit" 
      },
      {
        "value": 'c', 
        "label": "Celsius" 
      },
    ]
  }
}

let storedData = {
  settings: settings,
  weather_key: null,
  location_key: null,
  forecast_data: null,
  weather_data: null,
}

async function start({ sendDataToMain }) {

  sendDataToMainFn = sendDataToMain;

  // Get the manifest data
  const manifestPath = path.join(__dirname, 'manifest.json');
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Get the saved data from main
  sendDataToMain('get', 'data')

  sendLog('Started Successfully!')
}
async function stop() {
  /* HANDLE STOPPING THE APP AND ANY RUNNING PROCESSES */

  sendLog('Stopping...')
  manifest = null
  sendDataToMainFn = null
}

const sendLog = (message) => {
  sendDataToMainFn('log', message)
}
const sendError = (message) => {
  sendDataToMainFn('error', message)
}
const sendMessage = (message) => {
  sendDataToMainFn('message', message)
}

const getData = (data) => {
  return storedData[data]
}
const setData = (data) => {
  sendDataToMainFn('add', data)
}


async function onMessageFromMain(event, ...args) {

  sendLog(`Received event ${event} with args ${args[0]} ${args[1]}`)
  try {
    switch (event) {
      case 'message':
         break

      case 'data': 
        if (args[0] == null) {
          sendDataToMainFn('set', storedData)
          sendDataToMainFn('get', 'auth', {
            'weather_key': {
              'value': '',
              'label': 'API KEY',
              'instructions': 'You can get your Weather Key from the <a href="https://developer.accuweather.com/user/me/apps" target="_blank" style="color: lightblue;">Accuweather Developer Dashboard</a>. You must create a new application and then under "API Key" Copy and paste that into this field.',
            },
            'location_key': {
              'value': '',
              'label': 'LOCATION KEY',
              'instructions': 'Go to <a href="https://developer.accuweather.com/accuweather-locations-api/apis/get/locations/v1/search" target="_blank" style="color: lightblue;">Accuweather API locations search</a>. Input the API Key into \"apikey\" and the location you want to get the weather for into \"q\". Then click \"Send this request\". Copy the \"Key\" from the response and paste it into this field.',
            }
          }
          )
        } else if (args[0].weather_key != null) {

          storedData.weather_key = args[0].weather_key,
          storedData.location_key = args[0].location_key
          storedData.forecast_data = args[0].forecast_data || null
          storedData.weather_data = args[0].weather_data || null

          sendDataToMainFn('add', storedData)

        } else {
          sendDataToMainFn('get', 'auth', {
            'weather_key': {
              'value': '',
              'label': 'API KEY',
              'instructions': 'You can get your Weather Key from the <a href="https://developer.accuweather.com/user/me/apps" target="_blank" style="color: lightblue;">Accuweather Developer Dashboard</a>. You must create a new application and then under "API Key" Copy and paste that into this field.',
            },
            'location_key': {
              'value': '',
              'label': 'LOCATION KEY',
              'instructions': 'Go to <a href="https://developer.accuweather.com/accuweather-locations-api/apis/get/locations/v1/search" target="_blank" style="color: lightblue;">Accuweather API locations search</a>. Input the API Key into \"apikey\" and the location you want to get the weather for into \"q\". Then click \"Send this request\". Copy the \"Key\" from the response and paste it into this field.',
            }
          }
          )
        }

        if (args[0]?.settings) {
          storedData.settings = args[0].settings

        } else {
          const settings = { settings: storedData.settings }
          sendDataToMainFn('add', settings)
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
        sendLog('Unknown message:', event, ...args)
        break
    }
  } catch (error) {
   sendError('Error in onMessageFromMain:', error)
  }
}

const handleGet = async (...args) => {
  if (args[0] == null) {
    sendError('WEATHER: No args provided')
    return
  }

  let response // The response that will be sent 
  switch (args[0].toString()) {
    case 'weather_info':
        if (args[1].key) {
          const weather_data = await getCityWeather()
          response = {type: 'weather_data', data: weather_data};
        } else {
          const weather_data = await getCurrentWeather();
          response = {type: 'weather_data', data: weather_data};
        }
        break;
      case 'forecast_info':
        // eslint-disable-next-line no-case-declarations
        const forecast_data = await get12hrWeather();

        response = {type: 'forecast_data', data: forecast_data};
        break;
    case 'manifest':
      response = manifest 
      sendDataToMainFn('manifest', response) 
      break
    default:
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  sendDataToMainFn('data', response) // type 'data' will send it directly to the CarThing to handle
}
const handleSet = async (...args) => {
  console.log('WEATHER: Handling SET request', ...args)

  if (args[0] == null) {
    console.log('WEATHER: No args provided')
    return
  }
  let response
  switch (args[0].toString()) {
    case 'update_setting': // This case will be called when the Car Thing tries and update the settings
      if (args[1] != null) {
        const {setting, value} = args[1]; // extract the new value and new setting
        settings[setting].value = value // Set the setting value to whatever the new one is (ensure that you handle the saving/usage of your settings correctly)

        console.log('WEATHER New Setting', settings)
        response = { settings: settings } // Send the updated settings back to the Car Thing to be displayed 
        sendDataToMainFn('add', response) // Also update the local settings on the app
      } else {
        console.log('WEATHER: No args provided', args[1])
        response = 'No args provided'
      }
      break
    default:
      console.log('WEATHER: Unknown request', args[0].toString())
      response = `${args[0].toString()} Not implemented yet!`
      break
  }
  console.log('WEATHER: Response', response)
  sendDataToMainFn('data', response)
}
module.exports = { start, onMessageFromMain, stop }



const isDataOutOfDate = (timestamp) => {
  const currentTime = new Date().getTime();
  const dataTime = new Date(timestamp).getTime();
  const hoursDifference = (currentTime - dataTime) / (1000 * 60 * 60);
  return hoursDifference;
};

const getCurrentWeather = async () => {
    try {
    
      const localData = storedData.weather_data;
      if (localData) {
        const time = isDataOutOfDate(localData.timestamp)
        if (time < parseFloat(settings.refresh_interval.value)) {
          sendLog("Returing logged weather data. Time since last request (hours):", time);
          return localData.data;
        }
      }
        
      sendMessage("GETTING NEW WEATHER DATA FROM SERVER\n");
        const api_url = `http://dataservice.accuweather.com/currentconditions/v1/${storedData.location_key}?apikey=${storedData.weather_key}&details=true`;
        const response = await get(api_url);
        sendLog("Returing new weather data + saving to file " + response);
        const newData = {
            timestamp: new Date().toISOString(),
            data: response.data,
        };
      await setData({"weather_data": newData});
  
      return response.data;

    } catch (error) {
      if (error.response.data.Code === 'ServiceUnavailable') {
        sendError('Exceeded Quota - Using cached data');
        const localData = storedData.weather_data;
        return localData.data;
      }
      // Handle token expiration and refresh
        sendError('Error getting current weather:' + error.response);
        throw error;
    }
  };
const getCityWeather = async (loc_key) => {
    try {
      throw new Error("Not implemented", loc_key);
      //const api_url = `http://dataservice.accuweather.com/currentconditions/v1/${loc_key}?apikey=${weather_key}&details=true`;
  //
      //const response = await axios.get(api_url);
  //
      //return response.data;

    } catch (error) {
      // Handle token expiration and refresh
        console.error('Error getting city weather:', error);
        throw error;
    }
  };
const get12hrWeather = async () => {
  try {

    const localData = storedData.forecast_data;
    if (localData) {
      const time = isDataOutOfDate(localData.timestamp)
      if (time < parseFloat(settings.refresh_interval.value)) {
        sendLog("Returing logged forecast data. Time since last request (hours):" + time);
        return localData.data;
      } else {
        sendLog("Time since last request (hours):" + time);
      }
    }

    sendMessage("GETTING NEW FORECASTING DATA FROM SERVER");
      const api_url = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${storedData.location_key}?apikey=${storedData.weather_key}`;
      const response = await get(api_url);
      sendLog("Returing new forecast data + saving to file");
      const newData = {
        timestamp: new Date().toISOString(),
        data: response.data,
      };
      await setData({"forecast_data": newData});

      return response.data;

    } catch (error) {
        if (error.response && error.response.data.Code === 'ServiceUnavailable') {
          sendError('Exceeded Quota - Using cached data');
          const localData = storedData.forecast_data;
          return localData.data;
        }
        sendError('Error getting 12 hour weather: ' + error);
        throw error;
    }
  };
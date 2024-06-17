import { getCurrentWeather, getCityWeather, get12hrWeather, } from './weatherUtil.js';
import { appEventEmitter, sendError, sendData } from '../../util/socketHandler.js'

appEventEmitter.on('Weather', async (socket, parsedMessage) => {
  try {

    switch (parsedMessage.type) {
      case 'get':
        await handleGetRequest(socket, parsedMessage);
        break;
      default:
        console.log('Unknown type', parsedMessage.type);
        break;
    }

  } catch (e) {
    console.log('There was an error in WeatherHandler');
  }
})

const handleGetRequest = async (socket, parsedMessage) => {
  try {
    switch (parsedMessage.request) {
      case 'weather_info':
        if (parsedMessage.data.key) {
          const weather_data = await getCityWeather()
          sendData(socket, 'weather_data', weather_data);
        } else {
          const weather_data = await getCurrentWeather();
          sendData(socket, 'weather_data', weather_data);
        }
        break;
      case 'forecast_info':
        // eslint-disable-next-line no-case-declarations
        const forecast_data = await get12hrWeather();

        sendData(socket, 'forecast_data', forecast_data);
        break;
      default:
        await sendError(socket, 'Unknown Set Request', parsedMessage.request);
        break;
    }
  } catch (e) {
    console.error('WEATHER: Error in HandleGetRequest', e)
  }
}
import { getCurrentWeather, getCityWeather, get12hrWeather, } from './weatherUtil.js';
import { server, sendError } from '../../util/socketHandler.js'

server.on('connection', async (socket) => {
  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.app == 'weather') {
        switch (parsedMessage.type) {
          case 'get':
            await handleGetRequest(socket, parsedMessage);
            break;
          default:
            console.log('Unknown type', parsedMessage.type);
            break;
        }
      }
    } catch (e) {
      console.log('There was an error in WeatherHandler');
    }
  })
})

const handleGetRequest = async (socket, parsedMessage) => {
  try {
    switch (parsedMessage.request) {
      case 'weather_info':
        if (parsedMessage.data.key) {
          const weather_data = await getCityWeather()
          socket.send(
            JSON.stringify({ type: 'weather_data', data: weather_data })
          );
        } else {
          const weather_data = await getCurrentWeather();
          socket.send(
            JSON.stringify({ type: 'weather_data', data: weather_data })
          );
        }
        break;
      case 'forecast_info':
        // eslint-disable-next-line no-case-declarations
        const forecast_data = await get12hrWeather()
        socket.send(JSON.stringify({ type: 'forecast_data', data: forecast_data }));
        break;
      default:
        await sendError(socket, 'Unknown Set Request', parsedMessage.request);
        break;
    }
  } catch (e) {
    console.error('WEATHER: Error in HandleGetRequest', e)
  }
}
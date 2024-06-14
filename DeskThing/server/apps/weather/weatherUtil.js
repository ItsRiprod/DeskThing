import axios from 'axios';
import { getData, setData } from '../../util/dataHandler.js';
const get = axios.get;
const weather_key = process.env.ACCUWEATHER_API_KEY; // trello app key
const location_key = process.env.ACCUWEATHER_CITY;
const DATA_EXPIRATION_HOURS = 0.5; // Define how many hours before the data is considered outdated
const CUR_EXPIRATION_HOURS = 0.5; // Define how many hours before the data is considered outdated

const isDataOutOfDate = (timestamp) => {
  const currentTime = new Date().getTime();
  const dataTime = new Date(timestamp).getTime();
  const hoursDifference = (currentTime - dataTime) / (1000 * 60 * 60);
  return hoursDifference;
};

const getCurrentWeather = async () => {
    try {
    
      const storedData = await getData('weatherData');
      if (storedData) {
        const time = isDataOutOfDate(storedData.timestamp)
        if (time < DATA_EXPIRATION_HOURS) {
          console.log("Returing logged weather data. Time since last request (hours):", time);
          return storedData.data;
        }
      }
        
        console.log("GETTING NEW WEATHER DATA FROM SERVER\n--------------------------------------------------------");
        const api_url = `http://dataservice.accuweather.com/currentconditions/v1/${location_key}?apikey=${weather_key}&details=true`;
        const response = await get(api_url);
        console.log("Returing new weather data + saving to file", response);
        const newData = {
            timestamp: new Date().toISOString(),
        data: response.data,
      };
      await setData('weatherData', newData);
  
      return response.data;

    } catch (error) {
      if (error.response.data.Code === 'ServiceUnavailable') {
        console.log('Exceeded Quota - Using cached data');
        const storedData = await getData('weatherData');
        return storedData.data;
      }
      // Handle token expiration and refresh
        console.error('Error getting current weather:', error.response);
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

    const storedData = await getData('forecastData');
    if (storedData) {
      const time = isDataOutOfDate(storedData.timestamp)
      if (time < DATA_EXPIRATION_HOURS) {
        console.log("Returing logged forecast data. Time since last request (hours):", time);
        return storedData.data;
      }
    }

      console.log("GETTING NEW FORECASTING DATA FROM SERVER\n--------------------------------------------------------");
      const api_url = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${location_key}?apikey=${weather_key}`;
      const response = await get(api_url);
      console.log("Returing new forecast data + saving to file");
      const newData = {
        timestamp: new Date().toISOString(),
        data: response.data,
      };
      await setData('forecastData', newData);

      return response.data;

    } catch (error) {
        if (error.response && error.response.data.Code === 'ServiceUnavailable') {
          console.log('Exceeded Quota - Using cached data');
          const storedData = await getData('forecastData');
          return storedData.data;
        }
        console.error('Error getting 12 hour weather:', error);
        throw error;
    }
  };

export {
    getCurrentWeather,
    getCityWeather,
    get12hrWeather,
};
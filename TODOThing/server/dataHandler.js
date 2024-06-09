/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, 'data.json');

// Helper function to read the data from the file
const readData = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data file:', err);
    return { boards: [], trelloAccessToken: null, trelloTokenSecret: null };
  }
};

// Helper function to write data to the file
const writeData = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing data file:', err);
  }
};

/* ------------------------\
* Trello Related File I/O
*/
const setTrelloAccessToken = (accessToken) => {
  const data = readData();
  data.trelloAccessToken = accessToken;
  writeData(data);
};


const getTrelloAccessToken = () => {
  const data = readData();
  return data.trelloAccessToken;
};

const setTrelloTokenSecret = (tokenSecret) => {
  const data = readData();
  data.trelloTokenSecret = tokenSecret;
  writeData(data);
};


const getTrelloTokenSecret = () => {
  const data = readData();
  return data.trelloTokenSecret;
};

const setTrelloPreferences = (pref) => {
  const data = readData();
  data.trelloPreferences = pref;
  writeData(data);
};

const getTrelloPreferences = () => {
  const data = readData();

  // Check if trelloPreferences exists in the data
  if (!data.trelloPreferences) {
    // If it doesn't exist, initialize it as an empty object
    data.trelloPreferences = {};
  }

  return data.trelloPreferences;
};

/* ------------------------\
* Spotify Related File I/O
*/

const setSpotifyAccessToken = (accessToken) => {
  const data = readData();
  data.spotifyToken = accessToken;
  writeData(data);
};


const getSpotifyAccessToken = () => {
  const data = readData();
  return data.spotifyToken;
};

/* ------------------------\
* Weather Related File I/O
*/

const setForecastData = (forecastData) => {
  const data = readData();
  data.forecastData = forecastData;
  writeData(data);
};


const getForecastData = () => {
  const data = readData();
  return data.forecastData;
};


const setWeatherData = (weatherData) => {
  const data = readData();
  data.weatherData = weatherData;
  writeData(data);
};


const getWeatherData = () => {
  const data = readData();
  return data.weatherData;
};

module.exports = {
  setTrelloAccessToken,
  getTrelloAccessToken,
  setTrelloTokenSecret,
  getTrelloTokenSecret,
  setTrelloPreferences,
  getTrelloPreferences,
  setForecastData,
  getForecastData,
  setWeatherData,
  getWeatherData,
  setSpotifyAccessToken,
  getSpotifyAccessToken,
};
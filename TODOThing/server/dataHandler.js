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

// Function to set the Trello access token
const setTrelloAccessToken = (accessToken) => {
  const data = readData();
  data.trelloAccessToken = accessToken;
  writeData(data);
};

// Function to get the Trello access token
const getTrelloAccessToken = () => {
  const data = readData();
  return data.trelloAccessToken;
};

// Function to set the Trello token secret
const setTrelloTokenSecret = (tokenSecret) => {
  const data = readData();
  data.trelloTokenSecret = tokenSecret;
  writeData(data);
};

// Function to get the Trello token secret
const getTrelloTokenSecret = () => {
  const data = readData();
  return data.trelloTokenSecret;
};

// Functions for weather stuff
const setForecastData = (forecastData) => {
  const data = readData();
  data.forecastData = forecastData;
  writeData(data);
};

// Function to get the Trello access token
const getForecastData = () => {
  const data = readData();
  return data.forecastData;
};

// Function to set the Trello token secret
const setWeatherData = (weatherData) => {
  const data = readData();
  data.weatherData = weatherData;
  writeData(data);
};

// Function to get the Trello token secret
const getWeatherData = () => {
  const data = readData();
  return data.weatherData;
};

module.exports = {
  setTrelloAccessToken,
  getTrelloAccessToken,
  setTrelloTokenSecret,
  getTrelloTokenSecret,
  setForecastData,
  getForecastData,
  setWeatherData,
  getWeatherData,
};
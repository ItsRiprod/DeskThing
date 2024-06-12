
/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';

const dataFilePath = './data.json';

const defaultData = {
  boards: [],
  weatherData: null,
  forecastData: null,
  spotifyToken: null,
  discordAuth: null,
  trelloAccessToken: null,
  trelloTokenSecret: null,
};

// Helper function to read the data from the file
const readData = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data file:', err);
    if (err.code === 'ENOENT') {
      const defaultData = { boards: [], weatherData:null, forecastData:null, spotifyToken: null, discordAuth: null, trelloAccessToken: null, trelloTokenSecret: null };
      fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }

    console.error('Error reading data file:', err);
    return { boards: [], discordAuth: null, spotifyToken: null,  trelloAccessToken: null, trelloTokenSecret: null };
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

const setData = (key, value) => {
  const data = readData();
  data[key] = value;
  writeData(data);
};

const getData = (key) => {
  const data = readData();
  return data[key];
};

export {
  setData,
  getData,
};

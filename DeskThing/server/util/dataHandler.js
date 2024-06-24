
/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = path.join(__dirname, './data.json');

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
    console.log("reading data from ", dataFilePath)
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data file:', err);
    if (err.code === 'ENOENT') {
      fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }

    return defaultData;
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

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * CURRENTLY UNUSED
 * 
 * May be needed later - so it is still here 
 */

const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, 'launchpadData.json');

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

const setDashboardData = (dbData) => {
  const data = readData();
  data.dashboardLayout = dbData;
  writeData(data);
};


const getDashboardData = () => {
  const data = readData();
  return data.dashboardLayout;
};
/* eslint-disable @typescript-eslint/no-var-requires */
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);


import { getPreferenceData, setModules } from './preferencesHandler.js';

class AppEventEmitter extends EventEmitter {}
const appEventEmitter = new AppEventEmitter();

// Create a WebSocket server that listens on port 8891
const server = new WebSocketServer({ port: 8891 });
// Check if the requested app is enabled in app_config.json
const configPath = path.join(__dirname, '../app_config.json');
let loadedModules = [];

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (config.modules && Array.isArray(config.modules)) {
    loadedModules = config.modules;
  }
  setModules(config.modules);
} else {
  console.error('SocketHandler could not find app_config');
}


const sendMessageToClients = (message) => {
  server.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
};

const sendResponse = async (socket, message) => {
  try {
    socket.send(JSON.stringify({ type: 'response', data: message }));
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
const sendData = async (socket, type, data) => {
  try {
    socket.send(JSON.stringify({ type: type, data: data }));
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const sendError = async (socket, error) => {
  try {
    console.error('Socket Error ', error);
    socket.send(JSON.stringify({ type: 'error', error: error }));
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Handle incoming messages from the client
server.on('connection', async (socket) => {
  console.log('Client connected!\nSending preferences...');
  const prefs = await getPreferenceData();
  sendData(socket, 'utility_pref_data', prefs)
  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Getting data', parsedMessage);
      
      appEventEmitter.emit(parsedMessage.app, socket, parsedMessage);
      
      
      if (!loadedModules.includes(parsedMessage.app)) {
        await sendError(socket, `App '${parsedMessage.app}' not loaded on the server!`);
        return;
      }

      if (parsedMessage.type === 'message') {
          console.log(`Message: ${parsedMessage.data}`);
          await sendResponse(socket, `Message ${parsedMessage.data} received`);
      }
    } catch (e) {
      console.error('Error in socketHandler', e)
  }})

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

export {
  sendMessageToClients,
  server,
  sendResponse,
  sendError,
  sendData,
  appEventEmitter,
}
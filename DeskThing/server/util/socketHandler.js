/* eslint-disable @typescript-eslint/no-var-requires */
import { WebSocketServer } from 'ws';


// Create a WebSocket server that listens on port 8891
const server = new WebSocketServer({ port: 8891 });

const sendMessageToClients = (message) => {
  console.log('Sending message:', message);
  server.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
};

// Helper function to format and return the song data


const sendResponse = async (socket, message) => {
  try {
    socket.send(JSON.stringify({ type: 'response', data: message }));
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
server.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Getting data', parsedMessage);

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
}
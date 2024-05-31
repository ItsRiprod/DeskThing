/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const fs = require('fs');
const { Server } = require('ws');
const robot = require('robotjs');
const { getCurrentPlayback, getCurrentDevice } = require('./spotifyHandler');
const { getTrelloBoards, getTrelloCards } = require('./trelloHandler');
// Create a WebSocket server that listens on port 8890
const server = new Server({ port: 8891 });

async function getImageData(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        const imageData = Buffer.from(response.data).toString('base64');
        return `data:image/jpeg;base64,${imageData}`;
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

server.on('connection', async (socket) => {
  console.log('Client connected');
  

  // Handle incoming messages from the client
  socket.on('message', async (message) => {
    console.log(`Received: ${message}`);

    // Here you can add logic to handle different types of messages
    // For example, you can parse JSON messages and respond accordingly
    try {
      const parsedMessage = JSON.parse(message);
      switch (parsedMessage.type) {
        case 'message':
          console.log(`Message: ${parsedMessage.data}`);
          socket.send(
            JSON.stringify({ type: 'response', data: `Message ${parsedMessage.data} received` })
          );
          break;
        
        case 'command':
          console.log(`Command: ${parsedMessage.command}`);
          switch(parsedMessage.command) {
            case 'next_track':
                
                    robot.keyTap('audio_next');
                    socket.send(
                      JSON.stringify({ type: 'response', data: `Command ${parsedMessage.command} executed` })
                    );
                
                break;
            case 'previous_track':
                robot.keyTap('audio_prev');
                socket.send(
                  JSON.stringify({ type: 'response', data: `Command ${parsedMessage.command} executed` })
                );
                break;
            case 'pause_track':
                robot.keyTap('audio_pause');
                socket.send(
                  JSON.stringify({ type: 'response', data: `Command ${parsedMessage.command} executed` })
                );
                break;
            case 'stop_track':
                robot.keyTap('audio_stop');
                socket.send(
                  JSON.stringify({ type: 'response', data: `Command ${parsedMessage.command} executed` })
                );
                break;
            case 'play_track':
                robot.keyTap('audio_play');
                socket.send(
                  JSON.stringify({ type: 'response', data: `Command ${parsedMessage.command} executed` })
                );
                break;
            default:
                socket.send(JSON.stringify({ type: 'error', data: 'Unknown command' }));
                break;
          }

          break;
        case 'get':
          console.log(`GET: ${parsedMessage.get}`);
          switch(parsedMessage.get) {
            case 'song_info':
                try {
                    const currentPlayback = await getCurrentPlayback();
                    const imageUrl = currentPlayback.item.album.images[2].url;
                    const imageData = await getImageData(imageUrl);
                    const returnData = {
                            photo: imageData,
                            duration_ms: currentPlayback.item.duration_ms,
                            name: currentPlayback.item.name,
                            progress_ms: currentPlayback.progress_ms,
                            is_playing: currentPlayback.is_playing,
                            artistName: currentPlayback.item.artists[0].name,
                    }
                    socket.send(
                      JSON.stringify({ type: 'trackData', data: returnData })
                    );
                  } catch (error) {
                    socket.send(
                      JSON.stringify({ type: 'error', data: error.message })
                    );
                  }
                break;
            case 'device_info':
                try {
                    const playbackState = await getCurrentDevice();
                    const returnData = {
                            device: {
                                id: playbackState.device.id,
                                name: playbackState.device.name,
                                is_active: playbackState.device.id == process.env.DEVICE_ID,
                                volume_percent: playbackState.device.volume_percent,
                            },
                            is_playing: playbackState.is_playing,
                    }
                    socket.send(
                      JSON.stringify({ type: 'deviceData', data: returnData })
                    );
                  } catch (error) {
                    socket.send(
                      JSON.stringify({ type: 'error', data: error.message })
                    );
                  }
                break;
            case 'boards_info':
                try {
                    const boards = await getTrelloBoards();
                    const returnData = {
                            boards: boards,
                    }
                    socket.send(
                      JSON.stringify({ type: 'boardData', data: returnData })
                    );
                  } catch (error) {
                    socket.send(
                      JSON.stringify({ type: 'error', data: error.message })
                    );
                  }
                break;
            case 'card_info':
                try {
                  const boardId = '64bc09f6567fab00c5a0b6b4';
                  const listId = '662f56f299216978d05e3e1e';
                  const cards = await getTrelloCards(boardId, listId);
                  const returnData = {
                    cards: cards,
                  };
                  socket.send(
                    JSON.stringify({ type: 'boardData', data: returnData })
                  );
                } catch (error) {
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
                }
                break;
            default:
                socket.send(JSON.stringify({ type: 'error', data: 'Unknown command' }));
                break;
          }

          break;
        
        default:
          socket.send(JSON.stringify({ type: 'error', data: 'Unknown message type' }));
          break;
      }
    } catch (e) {
      // Handle parsing error
      socket.send(JSON.stringify({ type: 'error', data: 'Invalid JSON format' }));
    }
  });

  // Handle client disconnection
  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8891');
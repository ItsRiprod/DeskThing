/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const fs = require('fs');
const { Server } = require('ws');
const robot = require('robotjs');
const { getCurrentPlayback, getCurrentDevice, skipToNext, play, pause, skipToPrev } = require('./spotifyHandler');
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

    const returnSongData = async (oldUri = null) => {
      try {
        let newTrackUri;
        let currentPlayback;
        const startTime = Date.now(); // Store the start time
        const timeout = 10000;
    
        // Wait until the track URI changes
        do {
          currentPlayback = await getCurrentPlayback();
          newTrackUri = currentPlayback.item.uri;
          await new Promise(resolve => setTimeout(resolve, 500));
        } while (newTrackUri === oldUri && Date.now() - startTime < timeout);
        if (newTrackUri === oldUri) {
          // Timeout reached, same song is playing
          socket.send(JSON.stringify({ type: 'error', data: 'Timeout reached, same song is playing' }));
          return;
        }
        const imageUrl = currentPlayback.item.album.images[0].url;
        const imageData = await getImageData(imageUrl);
        const returnData = {
          photo: imageData,
          duration_ms: currentPlayback.item.duration_ms,
          name: currentPlayback.item.name,
          progress_ms: currentPlayback.progress_ms,
          is_playing: currentPlayback.is_playing,
          artistName: currentPlayback.item.artists[0].name,
          uri: currentPlayback.item.uri,
        };
        socket.send(JSON.stringify({ type: 'trackData', data: returnData }));
      } catch (error) {
        socket.send(JSON.stringify({ type: 'error', data: error.message }));
      }
    };

    const sendResponse = async (message, spotify) => {
      try {
        socket.send(
          JSON.stringify({ type:'response', data: message, refresh: spotify || false  })
        );
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };

    try {
      const parsedMessage = JSON.parse(message);
      switch (parsedMessage.type) {
        case 'message':
          console.log(`Message: ${parsedMessage.data}`);
          sendResponse(`Message ${parsedMessage.data} received`, false);
          break;
        
        case 'command':
          console.log(`Command: ${parsedMessage.command}`);
          switch(parsedMessage.command) {
            case 'next_track':
              if(parsedMessage.spotify) {
                try {
                  const response = await skipToNext();
                  if (response) {
                    await returnSongData(parsedMessage.uri);
                  }
                } catch (error) {
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
                }
              } else {
                robot.keyTap('audio_next');
              }
              sendResponse(`Command ${parsedMessage.command} executed`, false);
              break;
            case 'previous_track':
              if(parsedMessage.spotify) {
                try {
                  const response = await skipToPrev();
                  if (response) {
                    await returnSongData(parsedMessage.uri);
                  }
                } catch (error) {
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
                }
              } else {
                robot.keyTap('audio_prev');
                sendResponse(`Command ${parsedMessage.command} executed`, parsedMessage.spotify);
                }
              break;
            case 'pause_track':
              if(parsedMessage.spotify) {
                try {
                  const response = await pause();
                  if (response) {
                    await returnSongData(parsedMessage.uri);
                  }
                } catch (error) {
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
                }
              } else {
                robot.keyTap('audio_pause');
              }
              sendResponse(`Command ${parsedMessage.command} executed`, false);
              break;
            case 'stop_track':
              if(parsedMessage.spotify) {
                try {
                  const response = await pause();
                  if (response) {
                    await returnSongData(parsedMessage.uri);
                  }
                } catch (error) {
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
                }
              } else {
                robot.keyTap('audio_stop');
                sendResponse(`Command ${parsedMessage.command} executed`, parsedMessage.spotify);
                }
              break;
            case 'play_track':
              if(parsedMessage.spotify) {
                try {
                  const response = await play();
                  if (response) {
                    await returnSongData(parsedMessage.uri);
                  }
                } catch (error) {
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
                }
              } else {
                robot.keyTap('audio_play');
                sendResponse(`Command ${parsedMessage.command} executed`, parsedMessage.spotify);
                }
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
                  returnSongData(null);
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
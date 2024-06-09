/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const fs = require('fs');
const { Server } = require('ws');
const robot = require('robotjs');
const { getCurrentPlayback, getCurrentDevice, skipToNext, play, pause, skipToPrev, seek } = require('./spotifyHandler');
const { removeListFromPref, addListToPref, getTrelloPrefs, setTrelloPrefs, getTrelloBoards, getTrelloCardsFromBoard, getTrelloCardsFromList, getTrelloListsFromBoard, getTrelloBoardsFromOrganization, getTrelloOrganizations } = require('./trelloHandler');
const { getCurrentWeather, getCityWeather, get12hrWeather } = require('./weatherHandler');
const { switchView } = require('./launchpadHandler');

// Create a WebSocket server that listens on port 8890
const server = new Server({ port: 8891 });

// Helper function for encoding images
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

// Process that runs once a client connects to the socket
server.on('connection', async (socket) => {
  console.log('Client connected');


  // Handle incoming messages from the client
  socket.on('message', async (message) => {
    console.log(`Received: ${message}`);

    // Helper function to format and return the song data
    const returnSongData = async (oldUri = null) => {
      try {
        let newTrackUri;
        let currentPlayback;
        const startTime = Date.now(); // Store the start time
        const timeout = 10000;
        let delay = 100;


        do {
          currentPlayback = await getCurrentPlayback();
          newTrackUri = currentPlayback.item.uri;
          delay = delay * 1.3; // Delay increases by 30% each time
          await new Promise(resolve => setTimeout(resolve, delay));
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
          playlistUri: currentPlayback.context.uri,
        };
        socket.send(JSON.stringify({ type: 'song_data', data: returnData }));
      } catch (error) {
        socket.send(JSON.stringify({ type: 'error', data: error.message }));
      }
    };

    // Helper function to send a response
    const sendResponse = async (message, spotify) => {
      try {
        socket.send(
          JSON.stringify({ type: 'response', data: message, refresh: spotify || false })
        );
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };

    // Primary response logic
    try {
      const parsedMessage = JSON.parse(message);
      // Switch case to go over types of messages 
      switch (parsedMessage.type) {
        case 'message':
          console.log(`Message: ${parsedMessage.data}`);
          sendResponse(`Message ${parsedMessage.data} received`, false);
          break;
        // Commands that relate to computer functions (Spotify / Macros)
        case 'command':
          switch (parsedMessage.command) {
            case 'next_track':
              if (parsedMessage.spotify) {
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
              if (parsedMessage.spotify) {
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
              if (parsedMessage.spotify) {
                try {
                  const response = await pause();
                  if (response) {
                    await returnSongData();
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
              if (parsedMessage.spotify) {
                try {
                  const response = await pause();
                  if (response) {
                    await returnSongData();
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
            case 'seek_track':
              if (parsedMessage.spotify) {
                try {
                  const response = await seek(parsedMessage.position_ms);
                  if (response) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await returnSongData();
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
              if (parsedMessage.spotify) {
                try {
                  const response = await play();
                  if (response) {
                    await returnSongData();

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

        // Commands that relate to the retrieval of data in some capacity
        case 'get':
          switch (parsedMessage.get) {
            /**
             * Spotify API
             */
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
                  JSON.stringify({ type: 'device_data', data: returnData })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
              /**
               * Trello API
               */
            case 'boards_info':
              try {
                const boards = await getTrelloBoards();
                socket.send(
                  JSON.stringify({ type: 'trello_board_data', data: boards })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'org_info':
              try {
                const orgs = await getTrelloOrganizations();

                socket.send(
                  JSON.stringify({ type: 'trello_org_data', data: orgs })
                );

              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'boards_from_org':
              try {
                const boards = await getTrelloBoardsFromOrganization(parsedMessage.data.id || null);
                socket.send(
                  JSON.stringify({ type: 'trello_board_data', data: boards })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'cards_from_board':
              try {
                const boardId = parsedMessage.data.id;
                const cards = await getTrelloCardsFromBoard(boardId)
                socket.send(
                  JSON.stringify({ type: 'trello_card_data', data: cards })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'lists_from_board':
              try {
                const boardId = parsedMessage.data.id;
                const cards = await getTrelloListsFromBoard(boardId)
                socket.send(
                  JSON.stringify({ type: 'trello_list_data', data: cards })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'cards_from_list':
              try {
                const listId = parsedMessage.data.id;
                const cards = await getTrelloCardsFromList(listId)
                socket.send(
                  JSON.stringify({ type: 'trello_card_data', data: cards })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'trello_pref_info':
              try {
                // Returns preferences
                const preferences = await getTrelloPrefs();
                socket.send(
                  JSON.stringify({ type: 'trello_pref_data', data: preferences })
                );
              } catch (error) {
                console.error('error', error);
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'trello_pref_list_info':
              try {
                // Returns array of preferred lists
                const prefs = await getTrelloPrefs();
                socket.send(
                  JSON.stringify({ type: 'trello_pref_list_data', data: prefs })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
              /**
               * Weather API
               */
            case 'weather_info':
              try {
                let weather_data = null;
                if (parsedMessage.data.key) {
                  weather_data = await getCityWeather()
                } else {
                  weather_data = await getCurrentWeather()
                }
                socket.send(
                  JSON.stringify({ type: 'weather_data', data: weather_data })
                );
              } catch (error) {
                socket.send(
                  JSON.stringify({ type: 'error', data: error.message })
                );
              }
              break;
            case 'forecast_info':
              try {
                const forecast_data = await get12hrWeather()
                socket.send(
                  JSON.stringify({ type: 'forecast_data', data: forecast_data })
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
        case 'set':
          switch (parsedMessage.get) {
            /**
             * Trello API
             */
            case 'trello_prefs':
              try {
                if (parsedMessage.data) {
                  setTrelloPrefs(parsedMessage.data);
                }
                console.log("Successfully set Trello prefs");
                } catch (error) {
                  console.error("Unable to set trello prefs!", error);
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
              }
              break;
            case 'trello_add_list_pref':
              try {
                if (parsedMessage.data) {
                  addListToPref(parsedMessage.data);
                }
                console.log("Successfully added list to Trello prefs");
                } catch (error) {
                  console.error("Unable to add trello prefs!", error);
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
              }
              break;
            case 'trello_remove_list_pref':
              try {
                removeListFromPref(parsedMessage.data.id);
                console.log("Successfully removed list from Trello prefs");
                } catch (error) {
                  console.error("Unable to remove trello list from prefs!", error.message);
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
              }
              returnSongData(null);
              break;
            case 'lp_view':
              try {
                  if (parsedMessage.data) {
                    switchView(parsedMessage.data);
                    console.log("Successfully switched views");
                  } else {
                    console.error('Unknown error (Did you forget to say what view you were switching to?)', parsedMessage)
                  }
                } catch (error) {
                  console.error("Unable to switch views!", error.message);
                  socket.send(
                    JSON.stringify({ type: 'error', data: error.message })
                  );
              }
              returnSongData(null);
              break;
            default:
              console.error('Unknown command', parsedMessage.get);
              socket.send(JSON.stringify({ type: 'error', data: 'Unknown set command' }));
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
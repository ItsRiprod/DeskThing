import { returnSongData, getCurrentDevice, skipToNext, play, pause, skipToPrev, seek, setVolume } from './spotifyUtil.js';
import { server, sendMessageToClients, sendError } from '../../util/socketHandler.js'

server.on('connection', async (socket) => {
  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.app == 'spotify') {
        switch (parsedMessage.type) {
          case 'get':
            await handleGetRequest(socket, parsedMessage);
            break;
            case 'set':
            await handleSetRequest(socket, parsedMessage);
          break;
          default:
            console.log('Unknown type', parsedMessage.type);
            break;
        }
      }
    } catch (e) {
      console.log('There was an error in SpotifyHandler');
    }
  })
})

const handleGetRequest = async (socket, parsedMessage) => {
  try {
    switch (parsedMessage.request) {
      case 'song_info':
        await returnSongData(socket);
        break;
      case 'device_info':
        // eslint-disable-next-line no-case-declarations
        const playbackState = await getCurrentDevice();
        sendMessageToClients({
          type: 'device_data',
          data: {
            device: {
              id: playbackState.device.id,
              name: playbackState.device.name,
              is_active: playbackState.device.id === process.env.DEVICE_ID,
              volume_percent: playbackState.device.volume_percent,
            },
            is_playing: playbackState.is_playing,
          },
        });
        break;
      default:
        await sendError(socket, 'Unknown Get Request', parsedMessage.request);
        break;
    }
  } catch (e) {
    console.error('SPOTIFY: Error in HandleGetRequest', e)
  }
}
const handleSetRequest = async (socket, parsedMessage) => {
  try {
    switch (parsedMessage.request) {
      case 'set_vol':
        await setVolume(parsedMessage.data);
        break;
      case 'next_track':
        await skipToNext();
        await returnSongData(socket, parsedMessage.data);
        break;
      case 'previous_track':
        await skipToPrev();
        await returnSongData(socket, parsedMessage.data);
        break;
      case 'pause_track':
      case 'stop_track':
        await pause();
        await returnSongData(socket);
        break;
      case 'seek_track':
        await seek(parsedMessage.position_ms);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await returnSongData();
        break;
      case 'play_track':
        await play();
        await returnSongData(socket);
        break;
      default:
        await sendError(socket, 'Unknown Set Request', parsedMessage.request);
        break;
    }
  } catch (e) {
    console.error('SPOTIFY: Error in HandleSetRequest', e)
  }
}

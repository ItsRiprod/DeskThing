import { AppStore } from '../store';
import { AUDIO_REQUESTS } from '../helpers/WebSocketService';
import controlHandler from '../store/controlStore';
import socket from '../helpers/WebSocketService';

// Define actions for each control
export const PlayPause = () => {
  const songData = controlHandler.getSongData();
  if (songData.is_playing) {
    handleSendCommand(AUDIO_REQUESTS.PAUSE, songData.id);
  } else {
    handleSendCommand(AUDIO_REQUESTS.PLAY, songData.id);
  }
  controlHandler.updateSongData({ is_playing: !songData.is_playing });
};

export const Skip = () => {
  const songData = controlHandler.getSongData();
  handleSendCommand(AUDIO_REQUESTS.NEXT, songData.id);
};
export const Rewind = () => {
  handleSendCommand(AUDIO_REQUESTS.NEXT);
};

export const Shuffle = () => {
  const songData = controlHandler.getSongData();
  handleSendCommand(AUDIO_REQUESTS.SHUFFLE, !songData.shuffle_state);
  controlHandler.updateSongData({ shuffle_state: !songData.shuffle_state });
};

export const Repeat = () => {
    const songData = controlHandler.getSongData();
  let newRepeatState;
  switch (songData.repeat_state) {
    case 'off':
      newRepeatState = 'all';
      break;
    case 'all':
      newRepeatState = 'track';
      break;
    case 'track':
      newRepeatState = 'off';
      break;
    default:
      newRepeatState = 'off';
  }
  controlHandler.updateSongData({ repeat_state: newRepeatState });
  handleSendCommand(AUDIO_REQUESTS.REPEAT, newRepeatState);
};


export const Pref1 = () => {
  AppStore.setCurrentView(getAppByButtonIndex(1));
}
export const Pref2 = () => {
  AppStore.setCurrentView(getAppByButtonIndex(2));
}
export const Pref3 = () => {
  AppStore.setCurrentView(getAppByButtonIndex(3));
}
export const Pref4 = () => {
  AppStore.setCurrentView(getAppByButtonIndex(4));
}

const getAppByButtonIndex = (index: number): string => {
    const apps = AppStore.getApps()
    if (index <= apps.length) {
      console.log(apps)
      return apps[index -1].name;
    }
  return 'dashboard'; // Default to dashboard if no valid app found
};
export const Swap = (index: number = 5) => {
  const currentView = AppStore.getCurrentView();
  if (socket.is_ready()) {
    const data = {
      app: 'server', // this should match what you have set on eventEmitter
      type: 'set', // This is just for you to specify type (get, set, put, post, etc)
      request: 'add_app',
      data: {app: currentView, index: index},
    };
    socket.post(data);
  }
};
export const VolUp = () => {
    const volume = controlHandler.getSongData().volume
    if (volume <= 100) {
        handleSendCommand(AUDIO_REQUESTS.VOLUME, volume + 5)
        controlHandler.updateSongData({ volume: volume + 5 })
    }
}
export const VolDown = () => {
    const volume = controlHandler.getSongData().volume
    if (volume >= 0) {
        handleSendCommand(AUDIO_REQUESTS.VOLUME, volume - 5)
        controlHandler.updateSongData({ volume: volume - 5 })
    }
}
const handleSendCommand = (request: string, payload = null, app = 'utility', type= 'set') => {
    if (socket.is_ready()) {
      const data = {
        type: type,
        request: request,
        app: app,
        data: payload
      };
      socket.post(data);
    }
  };
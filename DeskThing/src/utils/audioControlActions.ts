import { AppStore } from '../store';
import { AUDIO_REQUESTS } from '../helpers/WebSocketService';
import controlHandler, { handleSendSet } from '../helpers/controlHandler';
import socket from '../helpers/WebSocketService';

// Define actions for each control
export const runPlayPause = () => {
  const songData = controlHandler.getSongData();
  if (songData.is_playing) {
    handleSendSet(AUDIO_REQUESTS.PAUSE, songData.id);
  } else {
    handleSendSet(AUDIO_REQUESTS.PLAY, songData.id);
  }
  controlHandler.updateSongData({ is_playing: !songData.is_playing });
};

export const runSkip = () => {
  const songData = controlHandler.getSongData();
  handleSendSet(AUDIO_REQUESTS.NEXT, songData.id);
};
export const runRewind = () => {
  handleSendSet(AUDIO_REQUESTS.NEXT);
};

export const runShuffle = () => {
  const songData = controlHandler.getSongData();
  handleSendSet(AUDIO_REQUESTS.SHUFFLE, !songData.shuffle_state);
  controlHandler.updateSongData({ shuffle_state: !songData.shuffle_state });
};

export const runRepeat = () => {
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
  handleSendSet(AUDIO_REQUESTS.REPEAT, newRepeatState);
};


export const runSetPref = (index: number) => {
  AppStore.setCurrentView(getAppByButtonIndex(index));
};
const getAppByButtonIndex = (index: number): string => {
    const apps = AppStore.getApps()
    if (index <= apps.length) {
      console.log(apps)
      return apps[index -1].name;
    }
  return 'dashboard'; // Default to dashboard if no valid app found
};
export const runSwap = (index: number) => {
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
export const runVolUp = () => {
    const volume = controlHandler.getSongData().volume
    if (volume <= 100) {
        handleSendCommand(AUDIO_REQUESTS.VOLUME, volume + 5)
        controlHandler.updateSongData({ volume: volume + 5 })
    }
}
export const runVolDown = () => {
    const volume = controlHandler.getSongData().volume
    if (volume >= 0) {
        handleSendCommand(AUDIO_REQUESTS.VOLUME, volume - 5)
        controlHandler.updateSongData({ volume: volume - 5 })
    }
}
const handleSendCommand = (command: string, payload: number) => {
    if (socket.is_ready()) {
      const data = {
        type: 'set',
        request: command,
        app: 'utility',
        data: payload
      };
      socket.post(data);
    }
  };
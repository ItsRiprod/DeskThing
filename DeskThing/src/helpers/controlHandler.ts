import socket, { AUDIO_REQUESTS, socketData, song_data } from './WebSocketService';
import * as AudioControls from '../components/audioControls';
import {
  runPlayPause,
  runSkip,
  runRewind,
  runShuffle,
  runRepeat,
  runSwap,
  runSetPref,
  runVolUp,
  runVolDown,
} from '../utils/audioControlActions';


export enum ControlKeys {
  Tray1 = 'tray1',
  Tray2 = 'tray2',
  Tray3 = 'tray3',
  Tray4 = 'tray4',
  Tray5 = 'tray5',
  Button1 = 'button1',
  Button2 = 'button2',
  Button3 = 'button3',
  Button4 = 'button4',
  Button1Long = 'button1_long',
  Button2Long = 'button2_long',
  Button3Long = 'button3_long',
  Button4Long = 'button4_long',
  DialScrollRight = 'dial_scroll_right',
  DialScrollLeft = 'dial_scroll_left',
  DialPress = 'dial_press',
  DialPressLong = 'dial_press_long',
  FacePress = 'face_press',
  FaceLong = 'face_long',
}

/**
 * Sends by default a set command to set the audio source.
 * @param request Must be from AUDIO_REQUESTS to ensure it is a standard audio control
 * @param payload Optional payload that is usually the song.id for skipping or seek position
 * @param app Defaults to 'utility' but can be any music app installed (be careful changing this)
 * @param type Defaults to 'set' to set the source but can be 'get' to retrieve data 
 */
export const handleSendSet = (request: AUDIO_REQUESTS, payload = null, app = 'utility', type= 'set'): void => {
    if (socket.is_ready()) {
      const data = {
        app: app,
        type: type,
        request: request,
        data: payload,
      };
      socket.post(data);
    }
  };
  type ComponentMapping = {
    [key: string]: React.ComponentType<any>;
  };
  type ButtonMapping = {
    [key: string]: string;
  };
  type SongDataUpdateCallback = (data: song_data) => void;


  class ControlHandler {
    private static instance: ControlHandler;
    private buttonMapping: ComponentMapping = {};
    private actionMapping: { [key: string]: () => void } = {};
    private listeners: (() => void)[] = []
    private songData = {} as song_data
    private songDataUpdateCallbacks: SongDataUpdateCallback[] = [];


    private constructor() {
      this.initializeTrays();
      this.listeners.push(socket.on('client',this. handleClientData.bind(this)))
    }
    private initializeTrays() {
      const initialTrayConfig: ButtonMapping = {
        [ControlKeys.Tray1]: 'Shuffle',
        [ControlKeys.Tray2]: 'Rewind',
        [ControlKeys.Tray3]: 'PlayPause',
        [ControlKeys.Tray4]: 'Skip',
        [ControlKeys.Tray5]: 'Repeat',
        [ControlKeys.Button1]: 'Pref1',
        [ControlKeys.Button2]: 'Pref2',
        [ControlKeys.Button3]: 'Pref3',
        [ControlKeys.Button4]: 'Pref4',
        [ControlKeys.Button1Long]: 'Swap1',
        [ControlKeys.Button2Long]: 'Swap2',
        [ControlKeys.Button3Long]: 'Swap3',
        [ControlKeys.Button4Long]: 'Swap4',
        [ControlKeys.DialScrollLeft]: 'VolDown',
        [ControlKeys.DialScrollRight]: 'VolUp',
        [ControlKeys.DialPress]: 'PlayPause',
        [ControlKeys.DialPressLong]: 'Skip',
        [ControlKeys.FacePress]: 'Repeat',
        [ControlKeys.FaceLong]: 'Repeat',
      };
    
        this.handleConfigUpdate(initialTrayConfig);
      }
  
    static getInstance(): ControlHandler {
      if (!ControlHandler.instance) {
        ControlHandler.instance = new ControlHandler();
      }
      return ControlHandler.instance;
    }
  
    private handleConfigUpdate(data: ButtonMapping) {
        const componentMap: ComponentMapping = {
            PlayPause: AudioControls.PlayPause,
            Skip: AudioControls.Skip,
            Rewind: AudioControls.Rewind,
            Shuffle: AudioControls.Shuffle,
            Repeat: AudioControls.Repeat,
            Pref1: AudioControls.Pref1,
            Pref2: AudioControls.Pref2,
            Pref3: AudioControls.Pref3,
            Pref4: AudioControls.Pref4,
            VolUp: AudioControls.VolumeUp,
            VolDown: AudioControls.VolumeDown,
          };
          const actionMap: { [key: string]: () => void } = {
            PlayPause: runPlayPause,
            Skip: runSkip,
            Rewind: runRewind,
            Shuffle: runShuffle,
            Repeat: runRepeat,
            Pref1: () => runSetPref(1),
            Pref2: () => runSetPref(2),
            Pref3: () => runSetPref(3),
            Pref4: () => runSetPref(4),
            Swap1: () => runSwap(1),
            Swap2: () => runSwap(2),
            Swap3: () => runSwap(3),
            Swap4: () => runSwap(4),
            VolUp: runVolUp,
            VolDown: runVolDown,
          };
        for (const [key, componentName] of Object.entries(data)) {
          const Component = componentMap[componentName];
          const Action = actionMap[componentName];
          if (Component) {
            this.buttonMapping[key] = Component;
          } else {
            console.warn(`No component found for name: `, componentName);
          }
          if (Action) {
            this.actionMapping[key] = Action;
          } else {
            console.warn(`No action found for name: `, componentName);
          }
        }
    }

    // Notify all registered callbacks of the song data update
    private notifySongDataUpdate() {
        this.songDataUpdateCallbacks.forEach(callback => callback(this.songData));
      }
    subscribeToSongDataUpdate(callback: SongDataUpdateCallback) {
      this.songDataUpdateCallbacks.push(callback);
      return () => {
        this.songDataUpdateCallbacks = this.songDataUpdateCallbacks.filter(cb => cb!== callback);
      };
    }
    
      getSongData(): song_data {
        return this.songData;
      }

      updateSongData(updatedData: Partial<song_data>) {
        this.songData = { ...this.songData, ...updatedData };
        this.notifySongDataUpdate();
      }

    private handleClientData = (msg: socketData) => {
        if (msg.type ==='song') {
            const data = msg.data as song_data
            this.songData = data;
            this.notifySongDataUpdate()
        } else if (msg.type ==='settings') {
            const data = msg.data as ButtonMapping
            this.handleConfigUpdate(data);
        }
      };
  
    getControlComponent(key: ControlKeys): React.ComponentType<any> | null {
      return this.buttonMapping[key] || null;
    }
  
    getControlAction(key: ControlKeys): (() => void) | null {
      return this.actionMapping[key] || null;
    }
  
    runControlAction(key: ControlKeys): void {
      const action = this.actionMapping[key] || null;
      if (action) {
        action()
      }
    }

    cleanup() {
        this.listeners.forEach(removeListener => removeListener())
        this.songDataUpdateCallbacks = []
      }
  }

  export default ControlHandler.getInstance();
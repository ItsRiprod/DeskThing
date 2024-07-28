// src/controlStore.ts
import socket, { song_data } from '../helpers/WebSocketService';
import * as AudioControls from '../components/audioControls';
import * as AudioControlActions from '../utils/audioControlActions';

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

type ComponentMapping = {
  [key: string]: React.ComponentType<any>;
};

type ActionFunction = (...args: any[]) => void;

type ActionMapping = {
  [key: string]: ActionFunction;
};
type ButtonMapping = {
  [key in ControlKeys]?: string;
};

type SongDataUpdateCallback = (data: song_data) => void;

class ControlStore {
  private static instance: ControlStore;
  private buttonMapping: ComponentMapping = {};
  private actionMapping: ActionMapping = {};
  private componentRegistry: ComponentMapping = {};
  private actionRegistry: ActionMapping = {};
  private songData: song_data = {} as song_data;
  private songDataUpdateCallbacks: SongDataUpdateCallback[] = [];

  private constructor() {
    this.initializeRegistry();
    this.initializeTrays();
    socket.on('client', this.handleClientData.bind(this));
  }

  private initializeRegistry() {
    Object.entries(AudioControls).forEach(([name, component]) => {
      this.registerComponent(name, component);
    });

    Object.entries(AudioControlActions).forEach(([name, action]) => {
      this.registerAction(name, action);
    });
  }

  registerComponent(name: string, component: React.ComponentType<any>): void {
    this.componentRegistry[name] = component;
  }

  registerAction(name: string, action: ActionFunction): void {
    this.actionRegistry[name] = action;
  }

  private initializeTrays(): void {
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
      [ControlKeys.Button1Long]: 'Swap',
      [ControlKeys.Button2Long]: 'Swap',
      [ControlKeys.Button3Long]: 'Swap',
      [ControlKeys.Button4Long]: 'Swap',
      [ControlKeys.DialScrollLeft]: 'VolDown',
      [ControlKeys.DialScrollRight]: 'VolUp',
      [ControlKeys.DialPress]: 'PlayPause',
      [ControlKeys.DialPressLong]: 'Skip',
      [ControlKeys.FacePress]: 'Repeat',
      [ControlKeys.FaceLong]: 'Repeat',
    };
    this.handleConfigUpdate(initialTrayConfig);
  }

  static getInstance(): ControlStore {
    if (!ControlStore.instance) {
      ControlStore.instance = new ControlStore();
    }
    return ControlStore.instance;
  }

  private handleConfigUpdate(data: ButtonMapping): void {
    for (const [key, actionName] of Object.entries(data)) {
      const Component = this.componentRegistry[actionName];
      const Action = this.actionRegistry[actionName];

      if (Component) {
        this.buttonMapping[key] = Component;
      } else {
        console.warn(`No component found for name: ${actionName}`);
      }

      if (Action) {
        this.actionMapping[key] = Action;
      } else {
        console.warn(`No action found for name: ${actionName}`);
      }
    }
    console.log(data)
    if (socket.is_ready()) {
      socket.post({
        app: 'server',
        type: 'set',
        request: 'button_maps',
        data: data,
      });
    }
  }

  private handleClientData(msg: any): void {
    if (msg.type === 'song') {
      const data = msg.data as song_data;
      this.songData = data;
      this.notifySongDataUpdate();
    } else if (msg.type === 'settings') {
      if (msg.data[0] === 'server') {
        this.handleConfigUpdate(msg.data[0].settings.button_mapping as ButtonMapping);
      }
    } else if (msg.type === 'button_mappings') {
      //this.handleConfigUpdate(msg.data as ButtonMapping);
    } else if (msg.type === 'component_update') {
      const { name, component } = msg.data;
      this.registerComponent(name, component);
    } else if (msg.type === 'action_update') {
      const { name, action } = msg.data;
      this.registerAction(name, action);
    }
  }

  private notifySongDataUpdate(): void {
    this.songDataUpdateCallbacks.forEach(callback => callback(this.songData));
  }

  subscribeToSongDataUpdate(callback: SongDataUpdateCallback): () => void {
    this.songDataUpdateCallbacks.push(callback);
    return () => {
      this.songDataUpdateCallbacks = this.songDataUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  getSongData(): song_data {
    return this.songData;
  }

  updateSongData(updatedData: Partial<song_data>): void {
    this.songData = { ...this.songData, ...updatedData };
    this.notifySongDataUpdate();
  }

  getControlComponent(key: ControlKeys): React.ComponentType<any> | null {
    return this.buttonMapping[key] || null;
  }

  getControlAction(key: ControlKeys): (() => void) | null {
    return this.actionMapping[key] || null;
  }

  runControlAction(key: ControlKeys, ...args: any[]): void {
    console.log('Running action for', key)
    const action = this.actionMapping[key];
    if (action) {
      action(...args);
    } else {
        console.error('Action not found for ', key)
    }
  }

  cleanup(): void {
    this.songDataUpdateCallbacks = [];
  }
}

export default ControlStore.getInstance();
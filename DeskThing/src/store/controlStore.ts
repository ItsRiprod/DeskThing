// src/controlStore.ts
import WebSocketService, { song_data } from '../helpers/WebSocketService';
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
export type Button = {
  name: string
  description: string
  source: string
}

export type key = {
  id: string
  source: string
}

export type ButtonMapping = {
  [key: string]: Button
}

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
    this.setupWebSocket();
  }

  private async setupWebSocket() {
    await new Promise(resolve => setTimeout(resolve, 100));
    const socket = await WebSocketService; // Ensure WebSocketService is initialized
    socket.on('client', this.handleClientData.bind(this));
  }

  static getInstance(): ControlStore {
    if (!ControlStore.instance) {
      ControlStore.instance = new ControlStore();
    }
    return ControlStore.instance;
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
      [ControlKeys.Tray1]: { name: 'Shuffle', description: 'Shuffle', source: 'server' },
      [ControlKeys.Tray2]: { name: 'Rewind', description: 'Rewind', source: 'server' },
      [ControlKeys.Tray3]: { name: 'PlayPause', description: 'PlayPause', source: 'server' },
      [ControlKeys.Tray4]: { name: 'Skip', description: 'Skip', source: 'server' },
      [ControlKeys.Tray5]: { name: 'Repeat', description: 'Repeat', source: 'server' },
      [ControlKeys.Button1]: { name: 'Pref1', description: 'Pref1', source: 'server' },
      [ControlKeys.Button2]: { name: 'Pref2', description: 'Pref2', source: 'server' },
      [ControlKeys.Button3]: { name: 'Pref3', description: 'Pref3', source: 'server' },
      [ControlKeys.Button4]: { name: 'Pref4', description: 'Pref4', source: 'server' },
      [ControlKeys.Button1Long]: { name: 'Swap', description: 'Swap', source: 'server' },
      [ControlKeys.Button2Long]: { name: 'Swap', description: 'Swap', source: 'server' },
      [ControlKeys.Button3Long]: { name: 'Swap', description: 'Swap', source: 'server' },
      [ControlKeys.Button4Long]: { name: 'Swap', description: 'Swap', source: 'server' },
      [ControlKeys.DialScrollLeft]: { name: 'VolDown', description: 'VolDown', source: 'server' },
      [ControlKeys.DialScrollRight]: { name: 'VolUp', description: 'VolUp', source: 'server' },
      [ControlKeys.DialPress]: { name: 'PlayPause', description: 'PlayPause', source: 'server' },
      [ControlKeys.DialPressLong]: { name: 'Skip', description: 'Skip', source: 'server' },
      [ControlKeys.FacePress]: { name: 'Repeat', description: 'Repeat', source: 'server' },
      [ControlKeys.FaceLong]: { name: 'Repeat', description: 'Repeat', source: 'server' }
    };
    this.handleConfigUpdate(initialTrayConfig);
  }

  private handleConfigUpdate(data: ButtonMapping): void {
    for (const [key, button] of Object.entries(data)) {
      if (button.source !='server') {
        // Handle non-server buttons
        return
      }

      const Component = this.componentRegistry[button.name];
      const Action = this.actionRegistry[button.name];

      if (Component) {
        this.buttonMapping[key] = Component;
      } else {
        console.warn(`No component found for name: ${button.name}`);
      }

      if (Action) {
        this.actionMapping[key] = Action;
      } else {
        console.warn(`No action found for name: ${button.name}`);
      }
    }
  }

  private handleClientData(msg: any): void {
    if (msg.type === 'song') {
      const data = msg.data as song_data;
      this.songData = data;
      this.notifySongDataUpdate();
    } else if (msg.type === 'button_mappings') {
      this.handleConfigUpdate(msg.data as ButtonMapping);
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
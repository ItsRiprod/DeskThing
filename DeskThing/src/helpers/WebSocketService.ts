const BASE_URL = 'ws://localhost:8891';

type SocketEventListener = (msg: socketData) => void;

export function create_socket(): WebSocket {
  return new WebSocket(BASE_URL);
}

class WebSocketService {
  socket_connector: () => WebSocket;
  listeners: { [app: string]: SocketEventListener[] } = {};
  webSocket: WebSocket;

  constructor(socket_connector: () => WebSocket = create_socket) {
    this.socket_connector = socket_connector;

    this.webSocket = this.socket_connector();
    this.connect(this.webSocket);
  }

  reconnect(): void {
    this.connect(this.socket_connector());
  }

  connect(webSocket: WebSocket): void {
    this.webSocket = webSocket;
    // browser socket, WebSocket IPC transport
    webSocket.onopen = (): void => {
      this.registerEventHandler();
    };

    webSocket.onclose = () => {
      this.webSocket.close();
      setTimeout(this.reconnect.bind(this), 1000);
      return;
    };
    webSocket.onerror = () => {
      //setTimeout(this.reconnect.bind(this), 1000);
      this.webSocket.close();
      return;
    };
  }

  is_ready(): boolean {
    return this.webSocket.readyState > 0;
  }

  post(body: socketData): void {
    if (this.is_ready()) {
      this.webSocket.send(JSON.stringify(body));
    } else {
      console.error('WebSocket is not ready.');
    }
  }

  registerEventHandler = (): void => {
    this.webSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data.toString());
        const { app } = msg
        
        if (!this.listeners[app]) {
          this.listeners[app] = [];
        }
        //console.log('WEBSOCKET', msg)
        this.listeners[app].forEach((listener: SocketEventListener) => listener(msg as socketData));
      } catch (e) {
        console.error(e);
      }
    };
  };

  // This is what should be used. Returns a function that can be used to remove the socket
  on(app: string, listener: SocketEventListener): () => void {
    if (!this.listeners[app]) {
      this.listeners[app] = [];
    }
    this.listeners[app].push(listener);

    // Return a function that removes this listener
    return () => {
      this.removeSocketEventListener(app, listener);
    };
  }

  addSocketEventListener(app: string, listener: SocketEventListener) {
    if (!this.listeners[app]) {
      this.listeners[app] = [];
    }
    this.listeners[app].push(listener);
  }

  removeSocketEventListener(app: string, listener: SocketEventListener) {
    const index = this.listeners[app]?.indexOf(listener);
    if (index !== undefined && index !== -1) {
      this.listeners[app].splice(index, 1);
    }
  }
}

const socket = new WebSocketService();
export default socket;

export interface Manifest {
  isAudioSource: boolean
  requires: Array<string>
  label: string
  version: string
  description?: string
  author?: string
  id: string
  isWebApp: boolean
  isLocalApp: boolean
  platforms: Array<string>
  homepage?: string
  repository?: string
}

export interface App {
  name: string
  enabled: boolean
  running: boolean
  prefIndex: number
  manifest?: Manifest
}


export interface socketData {
  app: string;
  type: string;
  request?: string;
  data?: Array<string> | string | object | number | { [key:string]: string | Array<string> | song_data | App };
}

export type song_data = {
  album: string | null
  artist: string | null
  playlist: string | null
  playlist_id: string | null
  track_name: string
  shuffle_state: boolean | null
  repeat_state: string | null //off, all, track
  is_playing: boolean
  can_fast_forward: boolean // Whether or not there an an option to 'fastforward 30 sec'
  can_skip: boolean
  can_like: boolean
  can_change_volume: boolean
  can_set_output: boolean 
  track_duration: number | null
  track_progress: number | null
  volume: number // percentage 0-100
  thumbnail: string | null //base64 encoding that includes data:image/png;base64, at the beginning
  device: string | null // Name of device that is playing the audio
  id: string | null // A way to identify the current song (is used for certain actions)
  device_id: string | null // a way to identify the current device if needed
}

export enum AUDIO_REQUESTS {
  NEXT = "next",
  PREVIOUS = "previous",
  REWIND = "rewind",
  FAST_FORWARD = "fast_forward",
  PLAY = "play",
  PAUSE = "pause",
  SEEK = "seek",
  LIKE = "like",
  SONG = "song",
  VOLUME = "volume",
  REPEAT = "repeat",
  SHUFFLE = "shuffle",
}
const BASE_URL = 'ws://localhost:8891';

type SocketEventListener = (msg: socketData) => void;

export function create_socket(): WebSocket {
  return new WebSocket(BASE_URL);
}

class WebSocketService {
  socket_connector: () => WebSocket;
  listeners: SocketEventListener[] = [];
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
    //console.log('Send', body);
    this.webSocket.send(JSON.stringify(body));
  }

  registerEventHandler = (): void => {
    this.webSocket.onmessage = (event) => {
      try {
        //console.log('Receive', event.data);
        const msg = JSON.parse(event.data.toString());
        this.listeners.forEach((listener: SocketEventListener) => listener(msg));
      } catch (e) {
        console.error(e);
      }
    };
  };

  addSocketEventListener(listener: SocketEventListener) {
    this.listeners.push(listener);
  }

  removeSocketEventListener(listener: SocketEventListener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
}

const socket = new WebSocketService();
export default socket;

export interface socketData {
  app: string;
  type: string;
  request?: string;
  data?: Array<string> | string | object | number | { [key:string]: string | Array<string> | song_data };
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
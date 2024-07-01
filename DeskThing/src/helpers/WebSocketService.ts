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
        const msg = JSON.parse(event.data.toString());
        //console.log('Receive', msg);
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
  data?: Array<string> | string | object | number | { [key:string]: string | Array<string> | song_data | device_data };
}

export type device_data = {
  is_playing: boolean;
  shuffle_state: boolean,
  repeat_state: string,
  device: {
    id: string;
    name: string;
    is_active: boolean;
    volume_percent: number;
  };
};
export type song_data = {
  photo: string;
  duration_ms: number;
  name: string;
  progress_ms: number;
  is_playing: boolean;
  artistName: string;
  uri: string;
  playlistUri: string;
  albumName: string;
};
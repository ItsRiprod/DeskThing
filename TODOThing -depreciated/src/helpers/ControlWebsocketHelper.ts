// Opens websocket 8890 so that the carthing doesnt crash

export default class ControlWebsocketHelper {
  socket: WebSocket;
  constructor() {
    this.socket = new WebSocket('ws://localhost:8890');
  }
}

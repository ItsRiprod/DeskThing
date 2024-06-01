export default class ControlWebsocketHelper {
  socket: WebSocket;
  constructor() {
    this.socket = new WebSocket('ws://localhost:8890');
  }
}

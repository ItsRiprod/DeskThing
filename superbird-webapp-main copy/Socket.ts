import { INTERAPP_METHODS } from 'middleware/InterappActions';
import RequestLogger from 'helpers/RequestLogger';

const BASE_URL = 'ws://localhost:8890';

type SocketEventListener = (msg: any) => void;

export function create_socket(): WebSocket {
  return new WebSocket(BASE_URL);
}

export class Socket {
  socket_connector: () => WebSocket;
  webSocket: WebSocket;
  middlewareQueue: Array<any> = [];
  interappQueue: Array<any> = [];
  listeners: SocketEventListener[] = [];
  connectionEstablished = false;
  requestLogger: RequestLogger;
  shouldLogRequests = false;

  constructor(
    requestLogger: RequestLogger,
    socket_connector: () => WebSocket = create_socket,
  ) {
    this.socket_connector = socket_connector;
    this.requestLogger = requestLogger;

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
      this.flushQueue(this.middlewareQueue);
    };

    webSocket.onclose = () => {
      setTimeout(this.reconnect.bind(this), 1000);
      return;
    };
    webSocket.onerror = () => {
      setTimeout(this.reconnect.bind(this), 1000);
      return;
    };
  }

  is_ready(): boolean {
    return this.webSocket.readyState > 0;
  }

  post(body: Record<string, any>): void {
    const isInterappMessage =
      body.method && INTERAPP_METHODS.includes(body.method);
    const hasInterapp = this.connectionEstablished;

    if (isInterappMessage && !hasInterapp) {
      this.interappQueue.push(body);
    } else if (!isInterappMessage && !this.is_ready()) {
      this.middlewareQueue.push(body);
    } else {
      if (this.shouldLogRequests) {
        this.requestLogger.requestStarted(body.msgId, {
          uri: body.method,
          args: body.args,
          requestStart: Date.now(),
        });
      }
      this.webSocket.send(JSON.stringify(body));
    }
  }

  flushQueue(queue: Array<any>): void {
    while (queue.length) {
      this.post(queue.shift());
    }
  }

  registerEventHandler = (): void => {
    this.webSocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleConnectionStatus(msg);
      this.handleCallResult(msg);
      this.handleRemoteConfigUpdate(msg);
      this.handleSignalStrengthUpdate(msg);
      this.listeners.forEach((listener: SocketEventListener) => listener(msg));
    };
  };

  handleSignalStrengthUpdate(msg: any) {
    if (msg.type === 'signal_strength_update') {
      this.requestLogger.onSignalStrengthUpdated(msg.payload);
    }
  }

  handleRemoteConfigUpdate(msg: any) {
    if (msg.type === 'remote_configuration_update') {
      if (msg.payload?.log_requests) {
        this.shouldLogRequests = true;
        this.requestLogger.restartTimer();
        if (msg.payload?.log_signal_strength) {
          this.requestLogger.setIncludeSignalStrength(true);
        }
      }
    }
  }

  handleCallResult(msg: any) {
    const payloadReponseSize = msg.payload
      ? JSON.stringify(msg.payload).length
      : 0;
    if (msg.type === 'call_result') {
      if (this.shouldLogRequests) {
        this.requestLogger.requestFinished(
          msg.msgId,
          payloadReponseSize,
          Date.now(),
          true,
        );
      }
    } else if (msg.type === 'call_error') {
      if (this.shouldLogRequests) {
        this.requestLogger.requestFinished(
          msg.msgId,
          payloadReponseSize,
          Date.now(),
          false,
        );
      }
    }
  }

  handleConnectionStatus(msg) {
    if (msg.type === 'remote_control_connection_status') {
      const beingEnabled = !this.connectionEstablished && msg.payload;
      this.connectionEstablished = msg.payload;
      if (beingEnabled) {
        this.flushQueue(this.interappQueue);
      }
    } else if (msg.type === 'transport_connection_status') {
      if (!msg.payload) {
        this.connectionEstablished = false;
      }
    }
  }

  addSocketEventListener(listener: SocketEventListener) {
    this.listeners.push(listener);
  }
}

export default Socket;

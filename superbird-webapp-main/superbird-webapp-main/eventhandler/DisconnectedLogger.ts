import { RootStore } from 'store/RootStore';
import MiddlewareActions from 'middleware/MiddlewareActions';

export const LOG_INTERVAL = 60_000;
export const MINIMAL_DURATION_SECONDS = 5;

class DisconnectedLogger {
  middlewareActions: MiddlewareActions;

  timeoutId?: number;
  startTime: number = 0;

  constructor(
    { remoteControlStore }: RootStore,
    middlewareActions: MiddlewareActions,
  ) {
    this.middlewareActions = middlewareActions;

    remoteControlStore.onInterappDisconnect(this.handleDisconnect.bind(this));
    remoteControlStore.onInterappConnect(this.handleConnect.bind(this));

    this.startLoggingInterval();
  }

  handleConnect(): void {
    clearInterval(this.timeoutId);
    this.sendLogMessage(this.disconnectedForSeconds);
  }

  handleDisconnect(): void {
    this.startLoggingInterval();
  }

  startLoggingInterval(): void {
    this.resetStartTime();
    this.timeoutId = window.setInterval(() => {
      this.sendLogMessage(this.disconnectedForSeconds);
      this.resetStartTime();
    }, LOG_INTERVAL);
  }

  resetStartTime(): void {
    this.startTime = Date.now();
  }

  sendLogMessage(disconnectedDuration: number): void {
    if (disconnectedDuration >= MINIMAL_DURATION_SECONDS) {
      this.middlewareActions.pitstopLog({
        type: 'disconnected_time',
        time_disconnected_seconds: disconnectedDuration,
        timestamp: Date.now(),
      });
    }
  }

  get disconnectedForSeconds(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}

export default DisconnectedLogger;

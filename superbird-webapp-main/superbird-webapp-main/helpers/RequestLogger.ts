import InterappActions, { InterappMethods } from 'middleware/InterappActions';
import { runInAction } from 'mobx';

const INTERVAL_BATCH_LOG_MS = 60 * 1000; // 60 seconds
const BATCH_SIZE_LIMIT = 100;

export type RequestLog = {
  uri: string;
  args: object;
  success: boolean;
  request_start: number;
  duration: number;
  response_payload_size: number;
  signal_strength?: number;
};

export type Request = {
  uri: string;
  args: object;
  requestStart: number;
};

class RequestLogger {
  IGNORED_URIS = [InterappMethods.SendUbiBatch, InterappMethods.RequestLog];

  interappActions: InterappActions | undefined;

  timerId?: number;
  logs: Array<RequestLog> = [];
  isSending = false;
  requests: Map<number, Request> = new Map<number, Request>();
  signalStrength = -1;
  includeSignalStrength = false;

  public restartTimer = () => {
    runInAction(() => {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      this.timerId = window.setInterval(
        this.sendLogBatch,
        INTERVAL_BATCH_LOG_MS,
      );
    });
  };

  requestStarted = (msgId: number, request: Request) => {
    this.requests.set(msgId, request);
  };

  requestFinished = (
    msgId: number,
    payloadReponseSize: number,
    requestEnd: number,
    success: boolean,
  ) => {
    const request = this.requests.get(msgId);
    if (!request) {
      // We completed a request but it was never started.
      return;
    }
    const log: RequestLog = {
      uri: request.uri,
      args: request.args,
      success: success,
      request_start: request.requestStart,
      duration: requestEnd - request.requestStart,
      response_payload_size: payloadReponseSize,
    };
    if (this.includeSignalStrength) {
      log.signal_strength = this.signalStrength;
    }
    this.logRequest(log);
    this.requests.delete(msgId);
  };

  private logRequest = (log: RequestLog) => {
    runInAction(() => {
      if (this.IGNORED_URIS.includes(log.uri)) {
        return;
      }
      for (const [key, value] of Object.entries(log.args ?? {})) {
        log.args[key] = String(value);
      }
      this.logs.push(log);
      this.sendBatchIfLimitReached();
    });
  };

  sendLogBatch = () => {
    if (this.isSending || this.logs.length <= 0 || !this.interappActions) {
      return;
    }
    this.isSending = true;
    this.interappActions.requestLog(this.logs);
    this.clearQueue();
    this.isSending = false;
  };

  private sendBatchIfLimitReached = () => {
    if (this.logs.length >= BATCH_SIZE_LIMIT) {
      this.sendLogBatch();
      this.restartTimer();
    }
  };

  clearQueue = () => {
    this.logs = [];
  };

  onSignalStrengthUpdated(signalStrength: number) {
    this.signalStrength = signalStrength;
  }

  setIncludeSignalStrength(includeSignalStrength: boolean) {
    this.includeSignalStrength = includeSignalStrength;
  }
}

export default RequestLogger;

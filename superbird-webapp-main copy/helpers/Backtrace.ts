// this is just an error reporter, and the backtrace library was being annoying to try to recover
// so this isn't really worth recovering


// import { BacktraceClient } from 'backtrace-js';
// import { IBacktraceData } from 'backtrace-js/lib/model/backtraceData';
import InterappActions from 'middleware/InterappActions';
import { getBacktraceUuid } from 'backtrace_uuid';
import { Socket } from '../Socket';
import InterappError from 'middleware/InterappError';
import { maskUsernames } from './SpotifyUriUtil';

export type DeviceInfo = {
  serial: string;
  appVersion: string;
  osVersion: string;
};

const clientOptions = {
  timeout: 5,
  endpoint: 'N/A', // We don't use the libs API and use interapp. The mobile clients set this value.
  token: 'N/A', // We don't use the libs API and use interapp. The mobile clients set this value.
  userAttributes: {},
  disableGlobalHandler: true,
  handlePromises: false,
  enableMetricsSupport: false,
  rateLimit: 10,
  tabWidth: 2,
  contextLineCount: 200,
};

export default class Backtrace {
  // btClient: BacktraceClient;
  interappActions: InterappActions;
  deviceInfo: DeviceInfo = {
    serial: '',
    appVersion: '',
    osVersion: '',
  };

  constructor(socket: Socket, interappActions: InterappActions) {
    // this.btClient = new BacktraceClient(clientOptions);
    this.interappActions = interappActions;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  onMiddlewareEvent(msg) {
    if (msg.type === 'version_status') {
      this.deviceInfo = {
        serial: msg.serial,
        appVersion: msg.app_version,
        osVersion: msg.os_version,
      };
    }
  }

  reportError = (error: Error) => {
    /*let json: IBacktraceData;
    try {
      const uuid = getBacktraceUuid();
      const report = this.btClient.createReport(error, {
        symbolication_id: uuid,
      });

      if (error instanceof InterappError) {
        report.addAttribute('request.method', error.method);
        const maskedArgs = maskUsernames(error.args);
        report.addAttribute('request.args', JSON.stringify(maskedArgs));
      }
      json = report.toJson();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed to send backtrace report', e);
      return;
    }

    const { serial, appVersion, osVersion } = this.deviceInfo;
    this.interappActions
      .crashReport(serial, appVersion, osVersion, json)
      .catch(() => {});
    */
  };
}

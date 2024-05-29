import Socket from 'Socket';
import { makeAutoObservable } from 'mobx';
import MiddlewareActions from 'middleware/MiddlewareActions';

export type VersionStatusEvent = VersionStatus & {
  type: 'version_status';
};

type VersionStatus = {
  serial: string;
  os_version: string;
  app_version: string;
  touch_fw_version: string;
  model_name: string;
  fcc_id: string;
  ic_id: string;
};

class VersionStatusStore {
  versionStatus?: VersionStatus;
  middlewareActions: MiddlewareActions;

  constructor(socket: Socket, middlewareActions: MiddlewareActions) {
    makeAutoObservable(this, { middlewareActions: false });
    this.middlewareActions = middlewareActions;
    socket.addSocketEventListener(this.onMiddlewareEvent.bind(this));
  }

  onMiddlewareEvent(msg: VersionStatusEvent) {
    switch (msg.type) {
      case 'version_status':
        this.versionStatus = msg;
        break;
      default:
        break;
    }
  }

  get serial(): string | undefined {
    return this.versionStatus?.serial;
  }

  superbirdRequestVersion() {
    this.middlewareActions.superbirdRequestVersion();
  }
}

export default VersionStatusStore;

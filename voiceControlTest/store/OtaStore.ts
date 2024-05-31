import { reaction, makeAutoObservable } from 'mobx';
import Socket from '../Socket';
import { RootStore } from './RootStore';

type MiddlewareEventMessage = {
  type: string;
  critical?: boolean;
  auto_updatable?: boolean;
  name?: string;
  version?: string;
  payload?: boolean;
  percent?: number;
  bytes_transferred?: number;
  bytes_total?: number;
};

class OtaStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore, socket: Socket) {
    makeAutoObservable(this, {
      rootStore: false,
    });

    this.rootStore = rootStore;
    socket.addSocketEventListener((msg) => this.onEvent(msg));
  }

  // OTA package information
  updating = false;
  critical = false;
  autoUpdatable = true;
  name: string | undefined;
  version: string | undefined;
  // whether phone was able to download ota from the internet
  phoneDownloadStatus: boolean | undefined;
  // OTA transfer progress to CT
  transferPercent?: number;
  transferBytes?: number;
  transferTotal?: number;
  // generic state variables
  transferring = false;
  upgrading = false;
  success = false;
  error = false;

  onEvent(msg: MiddlewareEventMessage) {
    switch (msg.type) {
      case 'ota_update_available':
        this.updating = true;
        this.critical = msg.critical || false;
        this.autoUpdatable = msg.auto_updatable || false;
        this.name = msg.name;
        this.version = msg.version;
        break;
      case 'ota_phone_download_status':
        this.phoneDownloadStatus = msg.payload;
        if (!this.phoneDownloadStatus) {
          this.error = true;
          // Phone failed to download the package
        }
        break;
      case 'ota_transfer_in_progress':
        this.transferPercent = msg.percent;
        this.transferBytes = msg.bytes_transferred;
        this.transferTotal = msg.bytes_total;
        this.transferring = true;
        // TODO: Handle transfer failures somehow
        break;
      case 'ota_upgrade_in_progress':
        this.upgrading = true;
        // TODO: upgrade progress bar info will be available later from MW
        // TODO: handle upgrade failures somehow
        break;
      case 'ota_installed':
        this.success = true;
        // rebooting is handled in app.tsx
        // restart is sent from MW
        break;
      case 'ota_failed':
        this.error = true;
        // TODO: show OTA something went wrong
        break;
      default:
        break;
    }
  }

  get criticalUpdate(): boolean {
    return this.critical;
  }

  get updateSuccess(): boolean {
    return this.success && !this.error;
  }

  get status(): string {
    if (this.error) {
      return 'Failed!';
    } else if (this.success) {
      return 'Successfully installed!';
    } else if (this.upgrading) {
      return 'Upgrading...';
    } else if (this.transferring) {
      return 'Transferring';
    } else if (this.phoneDownloadStatus) {
      return 'Downloading';
    }
    return '';
  }

  onPhoneDownloadStatus(callback: () => void) {
    reaction(
      () => this.phoneDownloadStatus,
      (downloadComplete) => {
        if (downloadComplete) {
          callback();
        }
      },
    );
  }

  onCriticalOta(callback: () => void) {
    reaction(
      () => this.criticalUpdate,
      (criticalUpdate) => {
        if (criticalUpdate) {
          callback();
        }
      },
    );
  }

  onOtaFailed(callback: () => void) {
    reaction(
      () => this.error,
      (error) => {
        if (error) {
          callback();
        }
      },
    );
  }
}

export default OtaStore;

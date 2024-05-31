import { reaction, makeAutoObservable } from 'mobx';
import Socket from 'Socket';
import { RootStore } from './RootStore';

export const NO_CONNECTION_DELAY = 3_000;

export type PhoneType = 'Android' | 'iOS';

export type RemoteControlConnectionStatus = {
  type: 'remote_control_connection_status';
  payload: boolean;
  mac: string;
  phone_type: PhoneType;
};

type TransportConnectionStatus = {
  type: 'transport_connection_status';
  payload: boolean;
};

type RemoteControlMessage =
  | RemoteControlConnectionStatus
  | TransportConnectionStatus;

class RemoteControlStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore, socket: Socket) {
    makeAutoObservable(this, { rootStore: false });

    this.rootStore = rootStore;
    socket.addSocketEventListener((msg) => this.onEvent(msg));

    this.onInterappConnect(() => {
      this.handleInterappConnect();
    });

    this.onInterappDisconnect(() => {
      this.noConnectionDelayTimeoutId = window.setTimeout(() => {
        this.handleInterappDisconnect();
      }, NO_CONNECTION_DELAY);
    });
  }

  transportConnected = false;
  interappConnected = false;
  macAddress: string = '';
  lastMacAddress: string = '';
  noConnectionDelayTimeoutId?: number = undefined;
  disconnectDuringSession = false;
  phoneType: PhoneType = 'iOS';

  get noConnectionAtAll(): boolean {
    return !this.interappConnected;
  }

  resetAppStateOnMacAddressChanged() {
    if (this.lastMacAddress !== '' && this.lastMacAddress !== this.macAddress) {
      this.rootStore.resetAppState();
    }
    this.lastMacAddress = this.macAddress;
  }

  handleInterappConnect() {
    this.resetAppStateOnMacAddressChanged();
    window.clearTimeout(this.noConnectionDelayTimeoutId);
    this.rootStore.bluetoothStore.resetPin();
    this.rootStore.permissionsStore.getPermissions();
    this.rootStore.overlayController.maybeShowAModal();
  }

  handleInterappDisconnect() {
    this.setDisconnectionDuringSession(true);
    window.clearTimeout(this.noConnectionDelayTimeoutId);
    this.rootStore.resetAppState();
    this.rootStore.overlayController.maybeShowAModal();
  }

  isConnectedPhone(address: string | undefined): boolean {
    const { bluetoothStore } = this.rootStore;
    const isCurrentDevice =
      address === bluetoothStore.currentDevice?.address &&
      this.macAddress === bluetoothStore.currentDevice?.address;
    const isConnected = isCurrentDevice && this.interappConnected;
    return isConnected;
  }

  isNewPhoneConnected(): boolean {
    const { bluetoothStore, remoteControlStore } = this.rootStore;
    return (
      remoteControlStore.macAddress === bluetoothStore.currentDevice?.address &&
      remoteControlStore.interappConnected
    );
  }

  onEvent(msg: RemoteControlMessage) {
    switch (msg.type) {
      case 'remote_control_connection_status':
        this.interappConnected = msg.payload;
        this.macAddress = msg.mac;
        this.phoneType = msg.phone_type;
        break;
      case 'transport_connection_status':
        this.transportConnected = msg.payload;
        if (!this.transportConnected) {
          this.interappConnected = false;
        }
        break;
      default:
        break;
    }
  }

  setDisconnectionDuringSession(disconnected: boolean) {
    this.disconnectDuringSession = disconnected;
  }

  reset() {
    this.transportConnected = false;
    this.interappConnected = false;
    this.disconnectDuringSession = false;
  }

  onInterappConnect(callback: () => void) {
    reaction(
      () => this.interappConnected && this.macAddress,
      () => {
        if (this.interappConnected) {
          callback();
        }
      },
    );
  }

  onInterappDisconnect(callback: () => void) {
    reaction(
      () => this.interappConnected,
      () => {
        if (!this.interappConnected) {
          callback();
        }
      },
    );
  }

  onRemoteControlMacAddress(callback: () => void) {
    reaction(
      () => this.macAddress,
      () => {
        callback();
      },
    );
  }
}

export default RemoteControlStore;

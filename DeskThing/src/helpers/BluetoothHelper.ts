import ControlSocket from './ControlWebsocketHelper';

type ConnectionStatus = {
  type: 'bluetooth_connection_status';
  connected: boolean;
};

export type LocalDevice = {
  type: 'bluetooth_local_device';
  mac: string;
  name: string;
};

export type CurrentDevice = {
  type: 'bluetooth_current_device';
  address: string;
  name: string;
};

type PairingFinished = {
  type: 'bluetooth_pairing_finished';
  success: boolean;
};

type Pin = {
  type: 'bluetooth_pin';
  pin: string;
};

export type DeviceList = {
  type: 'bluetooth_device_list';
  payload: Device[];
};

type Device = {
  address: string;
  default: boolean;
  device_info: {
    name: string;
    type?: string;
  };
};

type BluetoothMessage =
  | ConnectionStatus
  | CurrentDevice
  | LocalDevice
  | PairingFinished
  | Pin
  | DeviceList;

class BluetoothStore {
  socket;

  constructor() {
    this.socket = ControlSocket;
    this.socket.addSocketEventListener((msg) => this.onEvent(msg));
  }

  paired: boolean | undefined;
  connected: boolean | undefined;
  pin: string | undefined;
  currentDevice?: Omit<CurrentDevice, 'type'>;
  localDevice?: Omit<LocalDevice, 'type'>;
  pairing: boolean = false;
  bluetoothDeviceList: Device[] = [];
  onPairingFinishedCallbacks: ((success: boolean) => void)[] = [];

  scan() {
    this.socket.post({ type: 'bluetooth', action: 'scan' });
  }

  pair(mac: string) {
    this.socket.post({ type: 'bluetooth', action: 'pair', mac });
  }

  forget(mac: string) {
    this.socket.post({ type: 'bluetooth', action: 'forget', mac });
  }

  triggerBTDeviceList() {
    this.socket.post({ type: 'bluetooth', action: 'list' });
  }

  select(mac: string) {
    this.socket.post({ type: 'bluetooth', action: 'select', mac });
  }

  bluetoothDiscoverable(discoverable: boolean) {
    this.socket.post({
        type: 'bluetooth',
        action: 'discoverable',
        discoverable,
      });
  }

  onEvent(msg: BluetoothMessage) {
    this.socket.handleMessage({type: "bluetooth", data: msg})
    switch (msg.type) {
      case 'bluetooth_connection_status':
        this.connected = msg.connected;
        break;
      case 'bluetooth_pairing_finished':
        this.onPairingFinishedCallbacks.forEach((callback) =>
          callback(msg.success || false),
        );
        this.pairing = false;
        break;
      case 'bluetooth_pin':
        this.pairing = true;
        this.pin = msg.pin || '';
        break;
      case 'bluetooth_current_device':
        this.currentDevice = {
          name: msg.name,
          address: msg.address,
        };
        break;
      case 'bluetooth_local_device':
        this.localDevice = {
          name: msg.name,
          mac: msg.mac,
        };
        break;
      case 'bluetooth_device_list':
        this.bluetoothDeviceList = msg.payload.map((device) => ({
          ...device,
          address: device.address,
        }));
        break;
      default:
        break;
    }
  }

  get bluetoothPairingPin(): string | undefined {
    return this.pin;
  }

  resetPin(): void {
    this.pin = undefined;
  }
  /*
  onPairingStarted(callback: () => void) {
    reaction(
      () => this.pairing,
      (ongoingPairing) => {
        if (ongoingPairing) {
          callback();
        }
      },
    );
  }

  onPairingFinished(callback: (success) => void) {
    this.onPairingFinishedCallbacks.push(callback);
  }

  onBluetoothDeviceListUpdates(callback: () => void) {
    reaction(
      () => this.bluetoothDeviceList,
      () => {
        callback();
      },
    );
  }

  onCurrentDeviceUpdates(callback: () => void) {
    reaction(
      () => this.currentDevice,
      () => {
        // only initiate callback if there is a new device connecting
        if (this.currentDevice?.address !== '') {
          callback();
        }
      },
    );
  }*/
}

export default BluetoothStore;

import MiddlewareActions from 'middleware/MiddlewareActions';
import { action, makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import PhoneConnectionContextMenuUiState from 'component/Settings/PhoneConnection/contextmenu/PhoneConnectionContextMenuUiState';

export enum PhoneConnectionModalView {
  ADD_NEW_PHONE,
  ADD_NEW_PAIRING,
  FORGET_PHONE_CONFIRM,
  FORGET_PHONE_PROGRESS,
  FORGET_PHONE_SUCCESS,
  FORGET_PHONE_FAILURE,
  SELECT_PHONE_PROGRESS,
  SELECT_PHONE_FAILURE,
  PHONE_SWITCH_SUCCESS,
  NEED_PREMIUM,
  NOT_LOGGED_IN,
}

export type Device = {
  name: string;
  address: string;
};

class PhoneConnectionStore {
  rootStore: RootStore;
  middlewareActions: MiddlewareActions;
  phoneConnectionContextMenuUiState: PhoneConnectionContextMenuUiState;
  phoneConnectionModalTimeout?: number;

  constructor(rootStore: RootStore, middlewareActions: MiddlewareActions) {
    makeAutoObservable(this, {
      rootStore: false,
      phoneConnectionContextMenuUiState: false,
      middlewareActions: false,
      phoneConnectionModalTimeout: false,
      unmountPhoneConnectionView: action.bound,
    });

    this.rootStore = rootStore;

    this.phoneConnectionContextMenuUiState =
      new PhoneConnectionContextMenuUiState(
        this,
        rootStore.remoteControlStore,
        rootStore.hardwareStore,
        rootStore.ubiLogger.settingsUbiLogger,
      );

    this.middlewareActions = middlewareActions;

    rootStore.bluetoothStore.onBluetoothDeviceListUpdates(() =>
      this.handleDeviceListUpdate(),
    );

    rootStore.bluetoothStore.onCurrentDeviceUpdates(() => {
      this.handleCurrentDeviceUpdate();
    });

    rootStore.remoteControlStore.onRemoteControlMacAddress(() =>
      this.handlePhoneConnectionUpdate(),
    );

    rootStore.bluetoothStore.onPairingStarted(() =>
      this.handleBluetoothPairing(),
    );

    rootStore.bluetoothStore.onPairingFinished((success) => {
      if (!success) {
        this.handlePhoneConnectionNotSuccessful();
      }
    });
  }

  phoneConnectionModal?: PhoneConnectionModalView;
  forgetConfirmationIsActive = true;
  phoneToConnectOrForget?: Device;
  phoneToAdd?: Device;
  phoneConnectionTimeoutId?: number;
  phoneForgetTimeoutId?: number;

  handleItemDialLongPress() {
    const {
      bluetoothStore,
      settingsStore,
      hardwareStore,
      ubiLogger: { settingsUbiLogger },
    } = this.rootStore;

    const index = settingsStore.currentView.index;
    if (
      bluetoothStore.bluetoothDeviceList.length !== index &&
      !this.phoneConnectionContextMenuUiState.phoneMenuShowing &&
      !this.phoneConnectionModal
    ) {
      const device = bluetoothStore.bluetoothDeviceList[index];
      settingsUbiLogger.logPhoneDialLongPress();
      this.setPhoneToConnectOrForget({
        name: device.device_info?.name ?? '',
        address: device.address,
      });
      hardwareStore.setDialPressed(false);
      this.phoneConnectionContextMenuUiState.showMenu();
    }
  }

  handleAddNewPhoneClick = () => {
    this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionNewPhoneClick(
      this.newPhoneItemPosition,
    );
    this.showAddNewPhone();
  };

  handleAddNewPhoneDialPress = () => {
    this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionNewPhoneDialPressed(
      this.newPhoneItemPosition,
    );
    this.showAddNewPhone();
  };

  private showAddNewPhone() {
    this.bluetoothDiscoverable(true);
    this.setPhoneConnectionModal(PhoneConnectionModalView.ADD_NEW_PHONE);
  }

  handleBluetoothPairing() {
    if (this.rootStore.settingsStore.currentIsPhoneConnection) {
      this.setPhoneConnectionModal(PhoneConnectionModalView.ADD_NEW_PAIRING);
    }
  }

  handleDeviceListUpdate() {
    const { settingsStore } = this.rootStore;
    const phoneInList = this.rootStore.bluetoothStore.bluetoothDeviceList.some(
      ({ address }) => address === this.phoneToConnectOrForget?.address,
    );
    if (!!this.phoneToConnectOrForget && !phoneInList) {
      this.clearForgetResponseTimeout();
      this.setPhoneConnectionModal(
        PhoneConnectionModalView.FORGET_PHONE_SUCCESS,
      );
      settingsStore.handleSettingSetNewIndex(0);
      this.phoneConnectionModalTimeout = window.setTimeout(() => {
        this.resetPhoneConnectionModal();
        this.resetPhoneToConnectOrForget();
        this.phoneConnectionContextMenuUiState.dismissMenu();
      }, 2_000);
    } else if (!!this.phoneToConnectOrForget && phoneInList) {
      this.handlePhoneForgetNotSuccessful();
    }
  }

  async handlePhoneConnectionUpdate() {
    const {
      remoteControlStore,
      settingsStore,
      permissionsStore,
      sessionStateStore,
    } = this.rootStore;
    const isNewConnected =
      this.isNewPairingModal && remoteControlStore.isNewPhoneConnected();
    const isSelectedConnected = remoteControlStore.isConnectedPhone(
      this.phoneToConnectOrForget?.address,
    );
    if (isNewConnected || isSelectedConnected) {
      this.clearPhoneConnectResponseTimeout();
      this.setPhoneConnectionModal(
        PhoneConnectionModalView.PHONE_SWITCH_SUCCESS,
      );
      settingsStore.handleSettingSetNewIndex(0);
      this.phoneConnectionContextMenuUiState.dismissMenu();
      this.phoneConnectionModalTimeout = window.setTimeout(() => {
        if (permissionsStore.canUseCarThing === false) {
          this.handleNoPermission();
        } else if (!sessionStateStore.isLoggedIn) {
          this.handleUserNotLoggedIn();
        } else {
          this.resetPhoneConnectionFlow();
        }
      }, 2_000);
    }
  }

  handleCurrentDeviceUpdate() {
    const { bluetoothStore } = this.rootStore;
    const selectConnectionFailed =
      this.isSelectPhoneProgress &&
      this.phoneToConnectOrForget?.address !==
        bluetoothStore.currentDevice?.address;
    const connectNewFailed =
      !!this.phoneToAdd &&
      this.isNewPairingModal &&
      this.phoneToAdd?.address !== bluetoothStore.currentDevice?.address;
    if (selectConnectionFailed || connectNewFailed) {
      this.handlePhoneConnectionNotSuccessful();
    } else if (this.isNewPairingModal && !this.phoneToAdd) {
      this.phoneToAdd = bluetoothStore.currentDevice;
    }
  }

  handlePhoneConnectionNotSuccessful() {
    this.clearPhoneConnectResponseTimeout();
    this.setPhoneConnectionModal(PhoneConnectionModalView.SELECT_PHONE_FAILURE);
    window.setTimeout(() => {
      this.resetPhoneConnectionFlow();
    }, 5_000);
  }

  handlePhoneForgetNotSuccessful() {
    this.clearForgetResponseTimeout();
    if (this.isPhoneForgetProgressModal) {
      this.setPhoneConnectionModal(
        PhoneConnectionModalView.FORGET_PHONE_FAILURE,
      );
      window.setTimeout(() => {
        this.resetPhoneConnectionFlow();
      }, 5_000);
    }
  }

  handleNoPermission() {
    const { permissionsStore } = this.rootStore;
    // double check value as we don't want to await the permissions
    if (permissionsStore.canUseCarThing === false) {
      this.setPhoneConnectionModal(PhoneConnectionModalView.NEED_PREMIUM);
      window.setTimeout(() => {
        this.resetPhoneConnectionFlow();
      }, 5_000);
    } else {
      this.resetPhoneConnectionFlow();
    }
  }

  handleUserNotLoggedIn() {
    this.setPhoneConnectionModal(PhoneConnectionModalView.NOT_LOGGED_IN);
    window.setTimeout(() => {
      this.resetPhoneConnectionFlow();
    }, 5_000);
  }

  bluetoothDiscoverable(discoverable: boolean) {
    this.middlewareActions.bluetoothDiscoverable(discoverable);
  }

  resetPhoneConnectionFlow() {
    this.resetPhoneConnectionModal();
    this.resetPhoneToAdd();
    this.resetPhoneToConnectOrForget();
    this.phoneConnectionContextMenuUiState.dismissMenu();
  }

  resetPhoneToAdd() {
    this.phoneToAdd = undefined;
  }

  resetPhoneToConnectOrForget() {
    this.phoneToConnectOrForget = undefined;
  }

  setPhoneToConnectOrForget(device: Device) {
    this.phoneToConnectOrForget = device;
  }

  setPhoneConnectionModal(modal: PhoneConnectionModalView) {
    this.phoneConnectionModal = modal;
  }

  resetPhoneConnectionModal() {
    this.phoneConnectionModal = undefined;
    this.phoneConnectionModalTimeout = undefined;
  }

  dismissModal() {
    this.resetPhoneConnectionModal();
    this.clearPhoneConnectResponseTimeout();
    this.clearForgetResponseTimeout();
    this.setForgetConfirmationIsActive(true);
  }

  submitForget(device: Device) {
    const { bluetoothStore } = this.rootStore;
    this.phoneConnectionContextMenuUiState.dismissMenu();
    this.setPhoneConnectionModal(
      PhoneConnectionModalView.FORGET_PHONE_PROGRESS,
    );
    bluetoothStore.forget(device.address);
    this.phoneForgetTimeoutId = window.setTimeout(
      () => this.handlePhoneForgetNotSuccessful(),
      60_000,
    );
  }

  handleSelectPhoneClick(device: Device) {
    this.phoneConnectionContextMenuUiState.dismissMenu();
    this.submitSelectPhone({
      name: device.name,
      address: device.address,
    });
  }

  handleSelectPhoneDialPress = () => {
    const { bluetoothStore, settingsStore } = this.rootStore;
    const index = settingsStore.currentView.index;
    const device = bluetoothStore.bluetoothDeviceList[index];
    this.submitSelectPhone({
      name: device.device_info?.name ?? '',
      address: device.address,
    });
  };

  private submitSelectPhone(device: Device) {
    const { remoteControlStore, bluetoothStore } = this.rootStore;
    const isConnectedPhone = remoteControlStore.isConnectedPhone(
      device.address,
    );
    if (!isConnectedPhone) {
      this.setPhoneConnectionModal(
        PhoneConnectionModalView.SELECT_PHONE_PROGRESS,
      );
      this.setPhoneToConnectOrForget(device);
      bluetoothStore.select(device.address);
      this.phoneConnectionTimeoutId = window.setTimeout(
        () => this.handlePhoneConnectionNotSuccessful(),
        75_000,
      );
    }
  }

  clearPhoneConnectResponseTimeout() {
    window.clearTimeout(this.phoneConnectionTimeoutId);
  }

  clearForgetResponseTimeout() {
    window.clearTimeout(this.phoneForgetTimeoutId);
  }

  logDialogImpression() {
    switch (this.phoneConnectionModal) {
      case PhoneConnectionModalView.ADD_NEW_PHONE:
        this.logAddNewPhone();
        break;
      case PhoneConnectionModalView.SELECT_PHONE_PROGRESS:
        this.logSelectPhoneInProgress();
        break;
      case PhoneConnectionModalView.PHONE_SWITCH_SUCCESS:
        this.logSelectPhoneSuccess();
        break;
      case PhoneConnectionModalView.SELECT_PHONE_FAILURE:
        this.logSelectPhoneFailure();
        break;
      case PhoneConnectionModalView.NEED_PREMIUM:
        this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionPremiumRequiredDialog();
        break;
      case PhoneConnectionModalView.NOT_LOGGED_IN:
        this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionLoginRequiredDialog();
        break;
      default:
        break;
    }
  }

  private logAddNewPhone() {
    const position = this.rootStore.bluetoothStore.bluetoothDeviceList.length;
    this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionAddNewPhoneDialog(
      position,
    );
  }

  private logSelectPhoneInProgress() {
    this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionSelectPhoneInProgressDialog();
  }

  private logSelectPhoneSuccess() {
    this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionSelectPhoneSuccessDialog();
  }

  private logSelectPhoneFailure() {
    this.rootStore.ubiLogger.settingsUbiLogger.logPhoneConnectionSelectPhoneFailureDialog();
  }

  get newPhoneItemPosition(): number {
    return this.rootStore.bluetoothStore.bluetoothDeviceList.length + 1;
  }

  get isPhoneForgetProgressModal() {
    return (
      this.phoneConnectionModal ===
      PhoneConnectionModalView.FORGET_PHONE_PROGRESS
    );
  }

  get isNewPairingModal(): boolean {
    return (
      this.phoneConnectionModal === PhoneConnectionModalView.ADD_NEW_PAIRING
    );
  }

  get isSelectPhoneProgress(): boolean {
    return (
      !!this.phoneToConnectOrForget &&
      this.phoneConnectionModal ===
        PhoneConnectionModalView.SELECT_PHONE_PROGRESS
    );
  }

  handlePhoneForgetConfirmClick = () => {
    if (this.phoneToConnectOrForget) {
      this.rootStore.ubiLogger.settingsUbiLogger.logForgetConfirmClick(
        this.phoneToConnectOrForget.name,
      );
      this.submitForget(this.phoneToConnectOrForget);
    }
  };

  unmountPhoneConnectionView() {
    this.resetPhoneConnectionFlow();
    if (!this.rootStore.setupStore.shouldShowSetup) {
      this.bluetoothDiscoverable(false);
    }
  }

  setForgetConfirmationIsActive(isActive: boolean) {
    this.forgetConfirmationIsActive = isActive;
  }

  getPhoneConnectionDisplayStatus(device?: Device): string {
    const { bluetoothStore, remoteControlStore } = this.rootStore;
    const isCurrentDevice =
      device?.address === bluetoothStore.currentDevice?.address;
    const isConnected = remoteControlStore.isConnectedPhone(device?.address);
    const isConnecting = isCurrentDevice && !isConnected;

    if (isConnected) {
      return 'Connected';
    }

    if (isConnecting) {
      return 'Connecting...';
    }

    return 'Not Connected';
  }
}

export default PhoneConnectionStore;

import { makeAutoObservable } from 'mobx';
import PhoneConnectionStore, {
  Device,
  PhoneConnectionModalView,
} from 'store/PhoneConnectionStore';
import RemoteControlStore from 'store/RemoteControlStore';
import HardwareStore from 'store/HardwareStore';
import SettingsUbiLogger from 'component/Settings/SettingsUbiLogger';

class PhoneConnectionContextMenuUiState {
  phoneConnectionStore: PhoneConnectionStore;
  remoteControlStore: RemoteControlStore;
  hardwareStore: HardwareStore;
  settingsUbiLogger: SettingsUbiLogger;
  animateSliding = true;

  constructor(
    phoneConnectionStore: PhoneConnectionStore,
    remoteControlStore: RemoteControlStore,
    hardwareStore: HardwareStore,
    settingsUbiLogger: SettingsUbiLogger,
  ) {
    makeAutoObservable(this, {
      phoneConnectionStore: false,
      remoteControlStore: false,
      hardwareStore: false,
      settingsUbiLogger: false,
      animateSliding: false,
    });

    this.phoneConnectionStore = phoneConnectionStore;
    this.remoteControlStore = remoteControlStore;
    this.hardwareStore = hardwareStore;
    this.settingsUbiLogger = settingsUbiLogger;
  }

  phoneMenuItemStep = 0;
  phoneMenuShowing = false;

  get displayConnectionStatus(): string {
    return this.phoneConnectionStore.getPhoneConnectionDisplayStatus(
      this.phoneConnectionStore.phoneToConnectOrForget,
    );
  }

  get isConnected(): boolean {
    return this.remoteControlStore.isConnectedPhone(
      this.phoneConnectionStore.phoneToConnectOrForget?.address,
    );
  }

  get phoneName(): string | undefined {
    return this.phoneConnectionStore.phoneToConnectOrForget?.name;
  }

  get isDialPressed(): boolean {
    return this.hardwareStore.dialPressed;
  }

  get selectedItemIndex(): number {
    return this.phoneMenuItemStep;
  }

  get menuItems() {
    return this.isConnected ? ['Forget'] : ['Connect', 'Forget'];
  }

  get phoneMenuItem(): string {
    return this.menuItems[this.phoneMenuItemStep];
  }

  isActive(index: number): boolean {
    return this.phoneMenuItemStep === index;
  }

  setNewMenuIndex(index: number) {
    this.phoneMenuItemStep = index;
  }

  handleContextMenuClick = (device: Device) => {
    this.settingsUbiLogger.logPhoneActionsClick();
    this.phoneConnectionStore.setPhoneToConnectOrForget({
      name: device.name,
      address: device.address,
    });
    this.showMenu();
  };

  showMenu() {
    this.phoneMenuShowing = true;
  }

  dismissMenu() {
    this.phoneMenuShowing = false;
  }

  handleActionMenuItemClick(item: string) {
    if (item === 'Forget') {
      this.settingsUbiLogger.logActionMenuForgetRowClick();
    }
    this.handleMenuItemSelected(item);
  }

  handleActionMenuItemDialPress = (item: string) => {
    if (item === 'Forget') {
      this.settingsUbiLogger.logActionMenuForgetRowDialPress();
    }
    this.handleMenuItemSelected(item);
  };

  handleMenuItemSelected(item: string) {
    switch (item) {
      case 'Connect':
        if (this.phoneConnectionStore.phoneToConnectOrForget) {
          this.phoneConnectionStore.handleSelectPhoneClick(
            this.phoneConnectionStore.phoneToConnectOrForget,
          );
        }
        break;
      case 'Forget':
        this.phoneConnectionStore.setPhoneConnectionModal(
          PhoneConnectionModalView.FORGET_PHONE_CONFIRM,
        );
        break;
      default:
        break;
    }
  }

  goToNextItem() {
    const nextMenuItem = this.phoneMenuItemStep + 1;
    if (nextMenuItem < this.menuItems.length) {
      this.setNewMenuIndex(nextMenuItem);
    }
  }

  goToPreviousItem() {
    const prevMenuItem = this.phoneMenuItemStep - 1;
    if (prevMenuItem >= 0) {
      this.setNewMenuIndex(prevMenuItem);
    }
  }
}

export default PhoneConnectionContextMenuUiState;

import { makeAutoObservable } from 'mobx';
import { RootStore } from 'store/RootStore';
import { View } from 'store/ViewStore';

export type Overlay =
  | 'voice'
  | 'presets'
  | 'settings'
  | 'podcast_speed'
  | 'phone_call'
  | 'promo'
  | 'full_screen_clock'
  | 'lets_drive'
  | 'no_connection'
  | 'login_required'
  | 'premium_required'
  | 'bluetooth_pairing'
  | 'non_supported_type'
  | 'standby'
  | 'save_preset_error'
  | 'no_network';

export const MODAL_DELAY = 3000;
export const DEFAULT_PRESET_TIMEOUT = 4_000;
export const STANDBY_TIMEOUT = 5_000;

class OverlayUiState {
  currentOverlay?: Overlay = undefined;
  timeoutId?: number;
  rootStore: RootStore;
  noContextModalDelayTimeoutId?: number = undefined;
  noConnectionModalDelayTimeoutId?: number = undefined;
  dismissedNoNetwork: boolean = false;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      timeoutId: false,
      noContextModalDelayTimeoutId: false,
      noConnectionModalDelayTimeoutId: false,
      dismissedNoNetwork: false,
    });

    this.rootStore = rootStore;
  }

  powerOffConfirmationIsActive: boolean = true;

  reset(): void {
    window.clearTimeout(this.timeoutId);
    window.clearTimeout(this.noConnectionModalDelayTimeoutId);
    window.clearTimeout(this.noContextModalDelayTimeoutId);
    this.currentOverlay = undefined;
  }

  resetAndMaybeShowAModal(): void {
    this.reset();
    this.maybeShowAModal();
  }

  get isDismissible(): boolean {
    switch (this.currentOverlay) {
      case 'non_supported_type':
        return true;
      case 'standby':
        return true;
      case 'save_preset_error':
        return true;
      default:
        return false;
    }
  }

  isShowing(name: Overlay): boolean {
    return this.currentOverlay === name;
  }

  isShowingAny(): boolean {
    return this.currentOverlay !== undefined;
  }

  setPowerOffConfirmationIsActive(isActive: boolean) {
    this.powerOffConfirmationIsActive = isActive;
  }

  showOverlay(name: Overlay): void {
    this.currentOverlay = name;
  }

  showPresets(closingTimeout = DEFAULT_PRESET_TIMEOUT): void {
    this.showOverlay('presets');
    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      if (this.isShowing('presets')) {
        this.resetAndMaybeShowAModal();
      }
    }, closingTimeout);
  }

  showSettings(): void {
    const { settingsStore } = this.rootStore;
    this.showOverlay('settings');
    window.clearTimeout(this.timeoutId);
    if (settingsStore.isMainMenu) {
      this.timeoutId = window.setTimeout(this.hideSettings, 15_000);
    }
  }

  showStandby(): void {
    this.showOverlay('standby');
    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      this.resetAndMaybeShowAModal();
    }, STANDBY_TIMEOUT);
  }

  hideSettings = () => {
    if (this.rootStore.settingsStore.isMainMenu) {
      this.resetAndMaybeShowAModal();
    }
  };

  get shouldShowNoConnection(): boolean {
    const { remoteControlStore, bluetoothStore, settingsStore } =
      this.rootStore;

    return (
      remoteControlStore.noConnectionAtAll &&
      !bluetoothStore.pairing &&
      !settingsStore.currentIsPhoneConnection
    );
  }

  showNoConnection = (): void => {
    if (this.shouldShowNoConnection) {
      this.showOverlay('no_connection');
    }
  };

  get shouldShowNoContext(): boolean {
    const {
      playerStore,
      permissionsStore,
      sessionStateStore,
      viewStore,
    } = this.rootStore;
    return Boolean(
      !playerStore.contextUri &&
        permissionsStore.canUseCarThing &&
        sessionStateStore.isLoggedIn &&
        !sessionStateStore.isOffline &&
        !viewStore.isOnboarding &&
        !this.isShowing('settings'),
    );
  }

  showNoContext = (): void => {
    if (this.shouldShowNoContext) {
      this.showOverlay('lets_drive');
    }
  };

  maybeShowNoConnection(): boolean {
    const { remoteControlStore, bluetoothStore } = this.rootStore;

    if (this.shouldShowNoConnection) {
      // no connection during ongoing session uses onDisconnect timer
      if (remoteControlStore.disconnectDuringSession) {
        remoteControlStore.setDisconnectionDuringSession(false);
        this.showNoConnection();
      }
      // timer for no connection on bootup
      this.noConnectionModalDelayTimeoutId = window.setTimeout(
        this.showNoConnection,
        MODAL_DELAY,
      );
      return true;
    } else if (
      !remoteControlStore.noConnectionAtAll &&
      this.isShowing('no_connection')
    ) {
      this.resetAndMaybeShowAModal();
    } else if (
      remoteControlStore.noConnectionAtAll &&
      bluetoothStore.pairing &&
      this.isShowing('no_connection')
    ) {
      this.resetAndMaybeShowAModal();
    }
    return false;
  }

  maybeShowNoNetwork(): boolean {
    const { sessionStateStore, viewStore } = this.rootStore;

    if (
      sessionStateStore.isOffline &&
      [View.CONTENT_SHELF, View.TRACKLIST, View.QUEUE].includes(
        viewStore.currentView,
      ) &&
      !this.dismissedNoNetwork
    ) {
      this.showOverlay('no_network');
      return true;
    } else if (!sessionStateStore.isOffline) {
      this.dismissedNoNetwork = false;
      if (this.isShowing('no_network')) {
        this.resetAndMaybeShowAModal();
      }
    }
    return false;
  }

  maybeShowPremiumRequired(): boolean {
    const { permissionsStore } = this.rootStore;
    const shouldShowPremiumRequired =
      permissionsStore.canUseCarThing === false && !this.isShowing('settings');
    if (shouldShowPremiumRequired) {
      this.showOverlay('premium_required');
      return true;
    } else if (
      permissionsStore.canUseCarThing &&
      this.isShowing('premium_required')
    ) {
      this.resetAndMaybeShowAModal();
    }
    return false;
  }

  maybeShowLoginRequired(): boolean {
    const { sessionStateStore } = this.rootStore;
    const shouldShowNotLoggedIn =
      !sessionStateStore.isLoggedIn && !this.isShowing('settings');
    if (shouldShowNotLoggedIn) {
      this.showOverlay('login_required');
      return true;
    } else if (
      sessionStateStore.isLoggedIn &&
      this.isShowing('login_required')
    ) {
      this.resetAndMaybeShowAModal();
    }
    return false;
  }

  maybeShowLetsDrive(): boolean {
    if (this.shouldShowNoContext) {
      this.noContextModalDelayTimeoutId = window.setTimeout(
        this.showNoContext,
        MODAL_DELAY,
      );
      return true;
    } else if (!this.shouldShowNoContext && this.isShowing('lets_drive')) {
      this.resetAndMaybeShowAModal();
    }
    return false;
  }

  maybeShowBluetoothPairing(): boolean {
    const { bluetoothStore, settingsStore, remoteControlStore } =
      this.rootStore;
    if (bluetoothStore.pairing && !settingsStore.currentIsPhoneConnection) {
      this.showOverlay('bluetooth_pairing');
      return true;
    } else if (
      !bluetoothStore.pairing &&
      remoteControlStore.interappConnected &&
      this.isShowing('bluetooth_pairing')
    ) {
      this.resetAndMaybeShowAModal();
    }
    return false;
  }

  maybeShowNotSupportedType(isStation: boolean): boolean {
    if (isStation) {
      this.showOverlay('non_supported_type');
      return true;
    } else if (!isStation && this.isShowing('non_supported_type')) {
      this.resetAndMaybeShowAModal();
    }
    return false;
  }

  private maybeShowSavePresetError(): boolean {
    if (!this.rootStore.presetsDataStore.saveFailed) {
      return false;
    }

    this.rootStore.presetsDataStore.setSaveFailed(false);
    this.showOverlay('save_preset_error');

    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      if (this.isShowing('save_preset_error')) {
        this.resetAndMaybeShowAModal();
      }
    }, MODAL_DELAY);

    return true;
  }

  private maybeShowPhoneCall(): boolean {
    if (this.rootStore.phoneCallController.shouldShowPhoneCallOverlay) {
      this.showOverlay('phone_call');
      return true;
    }
    return false;
  }

  private maybeShowPromo(): boolean {
    if (this.rootStore.promoController.shouldShowPromo) {
      setTimeout(() => {
        if (this.rootStore.promoController.shouldShowPromo) {
          this.showOverlay('promo');
        }
      }, 3000);
      return true;
    }

    return false;
  }

  maybeShowAModal(): boolean {
    return (
      this.maybeShowBluetoothPairing() ||
      this.maybeShowNoConnection() ||
      this.maybeShowNoNetwork() ||
      this.maybeShowLoginRequired() ||
      this.maybeShowPremiumRequired() ||
      this.maybeShowPromo() ||
      this.maybeShowPhoneCall() ||
      this.maybeShowLetsDrive() ||
      // maybeShowNotSupportedType is set to true only when opening from context.
      this.maybeShowNotSupportedType(false) ||
      this.maybeShowSavePresetError()
    );
  }

  handleBackdropOnClick = () => {
    if (this.isDismissible) {
      this.maybeShowAModal();
    }
  };
}

export default OverlayUiState;

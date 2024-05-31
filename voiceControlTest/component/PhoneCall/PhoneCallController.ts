import RemoteControlStore from 'store/RemoteControlStore';
import AndroidPhoneCallStore from 'store/AndroidPhoneCallStore';
import IphonePhoneCallStore from 'store/IphonePhoneCallStore';
import { RootStore } from 'store/RootStore';
import Socket from 'Socket';
import MiddlewareActions from 'middleware/MiddlewareActions';
import PhoneCallUiState from 'component/PhoneCall/PhoneCallUiState';
import { computed, makeObservable } from 'mobx';
import SeedableStorageInterface from 'middleware/SeedableStorageInterface';

export interface PhoneCallStore {
  answer: () => void;
  hangUp: () => void;
  callerName?: string;
  callerNumber: string;
  isRingingIncoming: boolean;
  isRingingOutgoing: boolean;
  isOngoingPhoneCall: boolean;
  phoneCallImage: any;
  onCallInitiated: (callback: () => void) => void;
  onCallEnd: (callback: () => void) => void;
  reset: () => void;
}

export const PHONE_CALL_USER_ENABLED_KEY = 'phone_call_user_enabled';

class PhoneCallController {
  private androidPhoneCallStore: AndroidPhoneCallStore;
  private iphonePhoneCallStore: IphonePhoneCallStore;
  private remoteControlStore: RemoteControlStore;
  private middlewareActions: MiddlewareActions;
  private persistentStorage: SeedableStorageInterface;
  phoneCallUiState: PhoneCallUiState;

  constructor(
    rootStore: RootStore,
    socket: Socket,
    middlewareActions: MiddlewareActions,
  ) {
    this.androidPhoneCallStore = new AndroidPhoneCallStore(
      rootStore,
      rootStore.interappActions,
      socket,
    );
    this.iphonePhoneCallStore = new IphonePhoneCallStore(
      rootStore,
      middlewareActions,
      socket,
    );
    this.middlewareActions = middlewareActions;
    this.persistentStorage = rootStore.persistentStorage;
    this.remoteControlStore = rootStore.remoteControlStore;
    this.phoneCallUiState = new PhoneCallUiState(
      this,
      rootStore.ubiLogger.phoneCallUbiLogger,
    );

    makeObservable(this, { store: computed, isUserEnabled: computed });

    this.iphonePhoneCallStore.onCallInitiated(() =>
      rootStore.overlayController.maybeShowAModal(),
    );
    this.iphonePhoneCallStore.onCallEnd(() =>
      rootStore.overlayController.resetAndMaybeShowAModal(),
    );
    this.androidPhoneCallStore.onCallInitiated(() => {
      rootStore.overlayController.maybeShowAModal();
    });
    this.androidPhoneCallStore.onCallEnd(() =>
      rootStore.overlayController.resetAndMaybeShowAModal(),
    );
  }

  get isUserEnabled(): boolean {
    return Boolean(
      JSON.parse(
        this.persistentStorage.getItem(PHONE_CALL_USER_ENABLED_KEY) ?? 'true',
      ),
    );
  }

  get store(): PhoneCallStore {
    return this.remoteControlStore.phoneType === 'iOS'
      ? this.iphonePhoneCallStore
      : this.androidPhoneCallStore;
  }

  get shouldShowPhoneCallOverlay(): boolean {
    return (
      this.isUserEnabled &&
      (this.store.isRingingIncoming ||
        this.store.isRingingOutgoing ||
        this.store.isOngoingPhoneCall)
    );
  }

  setMicMuted(muted: boolean): void {
    this.middlewareActions.voiceMute(muted, false);
  }

  toggleIsUserEnabled(): void {
    this.persistentStorage.setItem(
      PHONE_CALL_USER_ENABLED_KEY,
      JSON.stringify(!this.isUserEnabled),
    );
  }

  reset() {
    this.androidPhoneCallStore.reset();
    this.iphonePhoneCallStore.reset();
  }
}

export default PhoneCallController;

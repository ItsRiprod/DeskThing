import { action, makeAutoObservable } from 'mobx';
import Socket from '../Socket';
import { RootStore } from './RootStore';

type MiddleWareSetupEvent = {
  type: 'setup_status';
  payload: string;
};

type InterappSetupEvent = {
  type: 'com.spotify.superbird.setup.event';
  payload: {
    event: string;
  };
};

type SetupMessage = MiddleWareSetupEvent | InterappSetupEvent;

const FINISHED = 'finished';

export enum SetupView {
  WELCOME = 'WELCOME',
  START_SETUP = 'START_SETUP',
  HELP = 'HELP',
  BT_PAIRING = 'BT_PAIRING',
  CONNECTED = 'CONNECTED',
  UPDATING = 'UPDATING',
  FAILED = 'FAILED',
  WAITING = 'WAITING',
}

enum SetupUiEvent {
  PAIRING_STARTED = 'PAIRING_STARTED',
  INTERAPP_CONNECTED = 'INTERAPP_CONNECTED',
  CRITICAL_OTA = 'CRITICAL_OTA',
  OTA_FAILED = 'OTA_FAILED',
  SETUP_FINISHED_PHONE = 'SETUP_FINISHED_PHONE',
  SETUP_NAVIGATION_PHONE = 'SETUP_NAVIGATION_PHONE',
  CONTINUE_FROM_WELCOME = 'CONTINUE_FROM_WELCOME',
  CONNECTION_FAIL_DURING_CRITICAL_DOWNLOAD = 'CONNECTION_FAIL_DURING_CRITICAL_DOWNLOAD',
}

class SetupStore {
  rootStore: RootStore;
  hasStatusMessage: boolean = false;
  setupStep: SetupView = SetupView.WELCOME;
  seenStart: boolean = false;
  phoneFinished: boolean = false;
  interappConnectionTimeoutId?: number;
  interappConnectionTimeoutDurationMs = 10_000;

  constructor(rootStore: RootStore, socket: Socket) {
    makeAutoObservable(this, { rootStore: false });

    this.rootStore = rootStore;
    socket.addSocketEventListener(this.onMiddlewareEvent.bind(this));

    this.rootStore.bluetoothStore.onPairingStarted(() => {
      this.handleSetupUiEvent(SetupUiEvent.PAIRING_STARTED);
    });

    this.rootStore.bluetoothStore.onPairingFinished((success) => {
      if (!success) {
        // Show the 'Start Setup' when the paring is failed
        this.handleSetupUiEvent(SetupUiEvent.CONTINUE_FROM_WELCOME);
        return;
      }

      if (this.interappConnectionTimeoutId !== undefined) {
        window.clearTimeout(this.interappConnectionTimeoutId);
      }
      this.interappConnectionTimeoutId = window.setTimeout(
        action(() => {
          // Consider something went wrong if the interapp connection is not
          // established within the timeout. Android 12 users can have that case when they
          // pair the device with Android Settings while they don't allow the
          // runtime Bluetooth permission for Spotify app yet.
          this.interappConnectionTimeoutId = undefined;
          this.handleSetupUiEvent(SetupUiEvent.CONTINUE_FROM_WELCOME);
        }),
        this.interappConnectionTimeoutDurationMs,
      );
    });

    this.rootStore.remoteControlStore.onInterappConnect(() => {
      if (this.interappConnectionTimeoutId !== undefined) {
        window.clearTimeout(this.interappConnectionTimeoutId);
      }
      this.handleSetupUiEvent(SetupUiEvent.INTERAPP_CONNECTED);
    });

    this.rootStore.remoteControlStore.onInterappDisconnect(() => {
      this.handleSetupUiEvent(
        SetupUiEvent.CONNECTION_FAIL_DURING_CRITICAL_DOWNLOAD,
      );
    });

    this.rootStore.otaStore.onCriticalOta(() => {
      this.handleSetupUiEvent(SetupUiEvent.CRITICAL_OTA);
    });

    this.rootStore.otaStore.onPhoneDownloadStatus(() => {
      if (this.rootStore.otaStore.criticalUpdate) {
        this.handleSetupUiEvent(SetupUiEvent.CRITICAL_OTA);
      }
    });

    this.rootStore.otaStore.onOtaFailed(() => {
      this.handleSetupUiEvent(SetupUiEvent.OTA_FAILED);
    });
  }

  get currentStep(): SetupView {
    return this.setupStep;
  }

  handleSetupUiEvent(event: SetupUiEvent) {
    const { otaStore } = this.rootStore;
    switch (event) {
      case SetupUiEvent.PAIRING_STARTED:
        this.setupStep = SetupView.BT_PAIRING;
        break;
      case SetupUiEvent.INTERAPP_CONNECTED:
        if (this.currentStep === SetupView.WAITING) {
          this.setupStep = SetupView.UPDATING;
        } else if (this.seenStart) {
          this.setupStep = SetupView.CONNECTED;
        } else this.setupStep = SetupView.START_SETUP;
        break;
      case SetupUiEvent.SETUP_FINISHED_PHONE:
        this.phoneFinished = true;
        if (otaStore.criticalUpdate && otaStore.error) {
          this.setupStep = SetupView.FAILED;
        } else if (
          otaStore.criticalUpdate &&
          this.currentStep === SetupView.CONNECTED
        ) {
          this.setupStep = SetupView.UPDATING;
        }
        break;
      case SetupUiEvent.SETUP_NAVIGATION_PHONE:
        if (this.currentStep === SetupView.START_SETUP) {
          this.setupStep = otaStore.criticalUpdate
            ? SetupView.UPDATING
            : SetupView.CONNECTED;
        }
        break;
      case SetupUiEvent.CONTINUE_FROM_WELCOME:
        this.setupStep = SetupView.START_SETUP;
        this.seenStart = true;
        break;
      case SetupUiEvent.CRITICAL_OTA:
        if (
          this.currentStep === SetupView.CONNECTED &&
          otaStore.autoUpdatable
        ) {
          this.setupStep = SetupView.UPDATING;
        } else if (
          this.currentStep === SetupView.CONNECTED &&
          !otaStore.autoUpdatable &&
          otaStore.phoneDownloadStatus
        ) {
          this.setupStep = SetupView.UPDATING;
        } else if (this.currentStep === SetupView.WAITING) {
          this.setupStep = SetupView.UPDATING;
        }
        break;
      case SetupUiEvent.OTA_FAILED:
        if (this.currentStep === SetupView.UPDATING && this.phoneFinished) {
          this.setupStep = SetupView.FAILED;
        }
        break;
      case SetupUiEvent.CONNECTION_FAIL_DURING_CRITICAL_DOWNLOAD:
        if (this.currentStep === SetupView.UPDATING) {
          this.setupStep = SetupView.WAITING;
        } else if (
          this.currentStep === SetupView.CONNECTED &&
          otaStore.criticalUpdate
        ) {
          this.setupStep = SetupView.WAITING;
        }
        break;
      default:
        break;
    }
  }

  onMiddlewareEvent(msg: SetupMessage): void {
    switch (msg.type) {
      case 'setup_status':
        this.maybeTogglePhoneFinished(msg.payload);
        this.hasStatusMessage = true;
        break;
      case 'com.spotify.superbird.setup.event':
        this.maybeTogglePhoneFinished(msg.payload.event);
        if (msg.payload.event?.includes('navigate')) {
          this.handleSetupUiEvent(SetupUiEvent.SETUP_NAVIGATION_PHONE);
        }
        this.hasStatusMessage = true;
        break;
      default:
        break;
    }
  }

  maybeTogglePhoneFinished(state: string) {
    if (!this.phoneFinished && state === FINISHED) {
      this.handleSetupUiEvent(SetupUiEvent.SETUP_FINISHED_PHONE);
    }
  }

  onContinueArrowClicked = () => {
    this.handleSetupUiEvent(SetupUiEvent.CONTINUE_FROM_WELCOME);
  };

  get isFinished(): boolean {
    return this.phoneFinished;
  }

  get shouldShowSetup(): boolean {
    if (
      [SetupView.UPDATING, SetupView.WAITING, SetupView.FAILED].includes(
        this.currentStep,
      )
    ) {
      return true;
    }

    return !this.isFinished;
  }
}

export default SetupStore;

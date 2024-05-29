import { makeAutoObservable, reaction } from 'mobx';
import { RootStore } from './RootStore';
import Socket from '../Socket';

type CarModeEvent = {
  type: 'com.spotify.superbird.car_mode';
  payload: { mode: string };
};

type SessionStateEvent = {
  type: 'com.spotify.session_state';
  payload: SessionStatePayload;
};

export enum ConnectionType {
  NONE = 'none',
  WLAN = 'wlan',
  '4G' = '4g',
}

export type SessionStatePayload = {
  connection_type?: ConnectionType;
  is_in_forced_offline_mode?: boolean;
  is_logged_in?: true;
  is_offline?: boolean;
};

type EventMessage = SessionStateEvent | CarModeEvent;

class SessionStateStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore, socket: Socket) {
    makeAutoObservable(this, { rootStore: false });

    this.rootStore = rootStore;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));

    this.onLogout(() => {
      this.rootStore.resetAppState();
    });
  }

  connectionType: string | undefined;
  isInForcedOfflineMode: boolean | undefined;
  isLoggedIn = true; // Assume logged in until explicitly told that we're not.
  isOffline = false;
  carMode: string | undefined;

  onMiddlewareEvent(msg: EventMessage) {
    switch (msg.type) {
      case 'com.spotify.session_state':
        this.onSessionState(msg);
        break;
      case 'com.spotify.superbird.car_mode':
        this.onCarMode(msg);
        break;
      default:
        break;
    }
  }

  onCarMode(msg: CarModeEvent) {
    this.carMode = msg.payload.mode;
  }

  onSessionState(msg: SessionStateEvent) {
    this.connectionType = msg.payload.connection_type;
    this.isInForcedOfflineMode = msg.payload.is_in_forced_offline_mode;
    this.isLoggedIn = !!msg.payload.is_logged_in;
    this.isOffline = msg.payload.is_offline ?? false;

    this.rootStore.overlayController.maybeShowAModal();
  }

  onLogout(callback: () => void) {
    reaction(
      () => this.isLoggedIn,
      () => {
        if (!this.isLoggedIn) {
          callback();
        }
      },
    );
  }

  get phoneHasNetwork(): boolean {
    return (
      this.connectionType !== undefined &&
      this.connectionType !== ConnectionType.NONE &&
      this.rootStore.remoteControlStore.interappConnected
    );
  }

  reset() {
    this.isLoggedIn = false;
  }
}

export default SessionStateStore;

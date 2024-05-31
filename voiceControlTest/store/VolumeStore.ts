import { reaction, makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import Socket from '../Socket';
import InterappActions from 'middleware/InterappActions';
import RemoteConfigStore from './RemoteConfigStore';

type VolumeEvent = {
  type:
    | 'com.spotify.volume.volume_state'
    | 'com.spotify.superbird.volume.volume_state';
  payload: VolumeState;
};

export type VolumeState = {
  volume_steps?: number;
  volume: number;
  controllable: boolean;
};

class VolumeStore {
  rootStore: RootStore;
  interappActions: InterappActions;
  remoteConfigStore: RemoteConfigStore;

  constructor(
    rootStore: RootStore,
    socket: Socket,
    interappActions: InterappActions,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      remoteConfigStore: false,
      debounceTimeoutId: false,
      debounceTimeoutDurationMs: false,
      receivedVolume: false,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;
    this.remoteConfigStore = rootStore.remoteConfigStore;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  localVolume?: number;
  receivedVolume?: number;
  debounceTimeoutId?: number;
  debounceTimeoutDurationMs = 1000;
  volumeSteps = 16; // Will be changed on first volume notification.

  onMiddlewareEvent(msg: VolumeEvent) {
    if (
      msg.type === 'com.spotify.volume.volume_state' ||
      msg.type === 'com.spotify.superbird.volume.volume_state'
    ) {
      // Do not update the local volume with received volume until after a timeout.
      // This avoids the local volume and volume state events fighting while we're making adjustments.
      this.receivedVolume = this.parseVolume(msg.payload.volume);
      this.volumeSteps = msg.payload.volume_steps || this.volumeSteps;
      if (this.debounceTimeoutId === undefined) {
        this.localVolume = this.receivedVolume;
      }
    }
  }

  parseVolume(volume: number) {
    return parseFloat(volume.toFixed(4));
  }

  increaseVolume() {
    this.maybeChangeVolume(0.1);
  }

  decreaseVolume() {
    this.maybeChangeVolume(-0.1);
  }

  maybeChangeVolume(delta: number) {
    if (!this.rootStore.sessionStateStore.carMode) {
      if (this.localVolume === undefined) return;

      if (delta > 0) {
        this.localVolume = Math.min(
            this.localVolume + 1 / this.volumeSteps,
            1,
        );
        this.interappActions.increaseVolume();
      } else if (delta < 0) {
        this.localVolume = Math.max(
            this.localVolume - 1 / this.volumeSteps,
            0,
        );
        this.interappActions.decreaseVolume();
      }
      this.startDebounceTimer();
    }
  }

  private startDebounceTimer() {
    // Do not update the local volume with received volume until after a timeout.
    // This avoids the local volume and volume state events fighting while we're making adjustments.
    if (this.debounceTimeoutId !== undefined) {
      window.clearTimeout(this.debounceTimeoutId);
    }
    this.debounceTimeoutId = window.setTimeout(() => {
      this.debounceTimeoutId = undefined;
      if (
        this.receivedVolume !== undefined &&
        this.localVolume !== this.receivedVolume
      ) {
        runInAction(() => {
          this.localVolume = this.receivedVolume;
        });
      }
    }, this.debounceTimeoutDurationMs);
  }

  onVolumeChange(callback: () => void) {
    reaction(
      () => this.localVolume,
      () => {
        callback();
      },
    );
  }

  get displayVolume(): number | undefined {
    if (this.localVolume !== undefined) {
      return this.parseVolume(this.localVolume);
    }
    return undefined;
  }
}

export default VolumeStore;

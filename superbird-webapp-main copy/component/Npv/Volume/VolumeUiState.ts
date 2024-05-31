import { get, makeAutoObservable, runInAction } from 'mobx';
import ImageStore from 'store/ImageStore';
import PlayerStore from 'store/PlayerStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import SessionStateStore from 'store/SessionStateStore';
import VolumeStore from 'store/VolumeStore';

const VOLUME_VIEW_TIMEOUT = 2_000;

export default class VolumeUiState {
  imageStore: ImageStore;
  playerStore: PlayerStore;
  sessionStateStore: SessionStateStore;
  volumeStore: VolumeStore;
  remoteConfigStore: RemoteConfigStore;

  volumeTimeoutId?: number;

  constructor(
    imageStore: ImageStore,
    playerStore: PlayerStore,
    remoteConfigStore: RemoteConfigStore,
    sessionStateStore: SessionStateStore,
    volumeStore: VolumeStore,
  ) {
    makeAutoObservable(this, {
      imageStore: false,
      playerStore: false,
      remoteConfigStore: false,
      sessionStateStore: false,
      volumeStore: false,
    });

    this.imageStore = imageStore;
    this.playerStore = playerStore;
    this.remoteConfigStore = remoteConfigStore;
    this.sessionStateStore = sessionStateStore;
    this.volumeStore = volumeStore;

    volumeStore.onVolumeChange(() => this.resetShowVolumeTimer());
  }

  get isPlayingSpotify(): boolean {
    return this.playerStore.isPlayingSpotify;
  }

  get shouldShowVolume(): boolean {
    const alwaysShowVolume =
      this.playerStore.playing &&
      this.volumeStore.displayVolume === 0 &&
      !this.sessionStateStore.carMode;
    return alwaysShowVolume || !!this.volumeTimeoutId;
  }

  get carMode() {
    return this.sessionStateStore.carMode;
  }

  get displayVolume() {
    return this.volumeStore.displayVolume ?? 0;
  }

  get volume() {
    return this.volumeStore.localVolume ?? 0;
  }

  get isVolumeAbove0() {
    return this.volume > 0;
  }

  get colorChannels() {
    return (
      get(this.imageStore.colors, this.playerStore.currentTrack.image_id) || [
        0, 0, 0,
      ]
    );
  }

  resetShowVolumeTimer() {
    window.clearTimeout(this.volumeTimeoutId);
    this.volumeTimeoutId = window.setTimeout(() => {
      runInAction(() => this.clearVolumeTimer());
    }, VOLUME_VIEW_TIMEOUT);
  }

  clearVolumeTimer() {
    this.volumeTimeoutId = undefined;
  }
}

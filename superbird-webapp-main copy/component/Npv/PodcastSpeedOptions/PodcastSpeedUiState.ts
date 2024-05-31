import { makeAutoObservable } from 'mobx';
import PlayerStore from 'store/PlayerStore';
import HardwareStore from 'store/HardwareStore';
import PodcastSpeedOptionsUbiLogger from 'eventhandler/PodcastSpeedOptionsUbiLogger';
import PodcastSpeedStore from 'store/PodcastSpeedStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import { OverlayController } from 'component/Overlays/OverlayController';

export default class PodcastSpeedUiState {
  overlayController: OverlayController;
  playerStore: PlayerStore;
  hardwareStore: HardwareStore;
  podcastSpeedViewUbiLogger: PodcastSpeedOptionsUbiLogger;
  remoteConfigStore: RemoteConfigStore;
  podcastSpeedStore: PodcastSpeedStore;
  animateSliding = true;
  constructor(
    playerStore: PlayerStore,
    overlayController: OverlayController,
    hardwareStore: HardwareStore,
    podcastSpeedViewUbiLogger: PodcastSpeedOptionsUbiLogger,
    remoteConfigStore: RemoteConfigStore,
    podcastSpeedStore: PodcastSpeedStore,
  ) {
    this.playerStore = playerStore;
    this.overlayController = overlayController;
    this.hardwareStore = hardwareStore;
    this.podcastSpeedViewUbiLogger = podcastSpeedViewUbiLogger;
    this.remoteConfigStore = remoteConfigStore;
    this.podcastSpeedStore = podcastSpeedStore;
    makeAutoObservable(this, {
      overlayController: false,
      playerStore: false,
      hardwareStore: false,
      speedOptions: false,
      timeoutId: false,
    });
  }
  speedOptions = [0.5, 0.8, 1, 1.2, 1.5, 1.8, 2, 2.5, 3, 3.5];
  selectedItem: number = 0.5;
  timeoutId?: number;

  get selectedItemIndex() {
    return this.speedOptions.findIndex((item) => this.selectedItem === item);
  }

  get smallHeader() {
    return this.selectedItemIndex !== 0;
  }

  get rightItem() {
    return this.speedOptions[this.selectedItemIndex + 1] || this.selectedItem;
  }

  get leftItem() {
    return this.speedOptions[this.selectedItemIndex - 1] || this.selectedItem;
  }

  updateSelectedItem(item): void {
    this.selectedItem = item;
  }

  handleDraggedToIndex(index: number): void {
    const userDraggedToItem = this.speedOptions[index];
    if (userDraggedToItem) {
      this.updateSelectedItem(userDraggedToItem);
    }
  }

  get podcastSpeed() {
    return this.podcastSpeedStore.podcastSpeed || this.playerStore.podcastSpeed;
  }

  get currentPlayingPodcastIndex() {
    return this.speedOptions.indexOf(this.podcastSpeed);
  }

  get currentOverlayIsPodcastSpeed() {
    return this.overlayController.isShowing('podcast_speed');
  }

  get dialPressed() {
    return this.hardwareStore.dialPressed;
  }

  handSpeedItemClicked(clickedItem) {
    this.podcastSpeedViewUbiLogger.logPodcastSpeedItemClicked(
      this.playerStore.currentTrackUri,
      clickedItem,
    );
    this.podcastSpeedStore.setPodcastSpeed(clickedItem);

    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      this.overlayController.resetAndMaybeShowAModal();
    }, 1000);
  }
}

import SwipeHandler from 'component/Npv/SwipeHandler';
import NpvUbiLogger from 'eventhandler/NpvUbiLogger';
import {
  ADVERTISEMENT,
  getShelfItemTitle,
  titleBasedOnType,
} from 'helpers/ContextTitleExtractor';
import { computed, makeAutoObservable } from 'mobx';
import ImageStore, { ImageScale } from 'store/ImageStore';
import PlayerStore from 'store/PlayerStore';
import QueueStore from 'store/QueueStore';
import ViewStore from 'store/ViewStore';
import TracklistStore from 'store/TracklistStore';
import VoiceStore from 'store/VoiceStore';
import WindAlertBannerUiState from 'component/Npv/WindAlertBanner/WindAlertBannerUiState';
import RemoteConfigStore from 'store/RemoteConfigStore';
import { OverlayController } from 'component/Overlays/OverlayController';

export default class PlayingInfoUiState {
  imageStore: ImageStore;
  playerStore: PlayerStore;
  queueStore: QueueStore;
  viewStore: ViewStore;
  tracklistStore: TracklistStore;
  voiceStore: VoiceStore;
  npvUbiLogger: NpvUbiLogger;
  swipeHandler: SwipeHandler;
  overlayController: OverlayController;
  remoteConfigStore: RemoteConfigStore;
  windAlertBannerUiState: WindAlertBannerUiState;

  constructor(
    imageStore: ImageStore,
    overlayController: OverlayController,
    playerStore: PlayerStore,
    queueStore: QueueStore,
    viewStore: ViewStore,
    tracklistStore: TracklistStore,
    voiceStore: VoiceStore,
    remoteConfigStore: RemoteConfigStore,
    windAlertBannerUiState: WindAlertBannerUiState,
    swipeHandler: SwipeHandler,
    npvUbiLogger: NpvUbiLogger,
  ) {
    makeAutoObservable(this, {
      imageStore: false,
      overlayController: false,
      playerStore: false,
      queueStore: false,
      viewStore: false,
      tracklistStore: false,
      voiceStore: false,
      remoteConfigStore: false,
      windAlertBannerUiState: false,
      swipeHandler: false,
      npvUbiLogger: false,
      currentItem: computed.struct,
      previousItem: computed.struct,
      nextItem: computed.struct,
    });

    this.imageStore = imageStore;
    this.overlayController = overlayController;
    this.playerStore = playerStore;
    this.queueStore = queueStore;
    this.viewStore = viewStore;
    this.tracklistStore = tracklistStore;
    this.voiceStore = voiceStore;
    this.remoteConfigStore = remoteConfigStore;
    this.windAlertBannerUiState = windAlertBannerUiState;
    this.swipeHandler = swipeHandler;
    this.npvUbiLogger = npvUbiLogger;
  }

  get isPlayingMusicAd() {
    return (
      this.playerStore.isPlayingAd &&
      !(this.playerStore.isPodcast || this.playerStore.isPodcastContext)
    );
  }

  get title() {
    return this.isPlayingMusicAd
      ? this.playerStore.currentTrackArtistName
      : this.currentItem.name || this.playerStore.currentTrack.name;
  }

  get subtitle() {
    if (this.isPlayingMusicAd) {
      return ADVERTISEMENT;
    }
    return (
      this.currentItem.artist_name || this.playerStore.currentTrackArtistName
    );
  }

  get currentItem() {
    return this.queueStore.current;
  }

  get previousItem() {
    return this.queueStore.previousItem;
  }

  get nextItem() {
    return this.queueStore.nextItem;
  }

  get onRepeat() {
    return this.playerStore.onRepeat;
  }

  get onRepeatOnce() {
    return this.playerStore.onRepeatOnce;
  }

  get isMicMuted() {
    return this.voiceStore.isMicMuted;
  }

  get isPlayingSpotify() {
    return this.playerStore.isPlayingSpotify;
  }

  get showWindLevelIcon() {
    return this.windAlertBannerUiState.shouldShowIcon;
  }

  get contextHeaderTitle() {
    return this.playerStore.isPlayingSpotify
      ? titleBasedOnType(this.playerStore, this.queueStore, true)
      : this.playerStore.otherActiveApp?.name;
  }

  handlePlayingInfoHeaderClick = () => {
    if (this.queueStore.isCurrentProviderQueue) {
      this.npvUbiLogger.logGoToQueue();
      this.queueStore.queueUiState.displayQueue();
    } else if (
      this.playerStore.isPlayingSpotify &&
      !this.queueStore.isCurrentProviderQueue &&
      !this.playerStore.isPlayingAd
    ) {
      this.npvUbiLogger.logContextTitleClicked(this.playerStore.contextUri);
      this.viewStore.showCurrentContextInTracklist();
    }
  };

  handleArtworkClick = () => {
    this.npvUbiLogger.logArtworkClicked(
      this.playerStore.playing,
      this.playerStore.currentTrackUri,
    );

    this.playerStore.togglePlayPause();
  };

  handleArtistClick = () => {
    if (!this.playerStore.currentTrack.artists) {
      return;
    }
    const artist = this.playerStore.currentTrack.artists[0];

    this.tracklistStore.tracklistUiState.initializeTracklist({
      uri: artist.uri,
      title: this.remoteConfigStore.graphQLShelfEnabled
        ? artist.name
        : getShelfItemTitle(artist.name, artist.uri),
    });

    this.viewStore.showTracklist();
  };

  showSettings = () => {
    this.overlayController.showSettings();
  };

  loadPrevAndNextImage() {
    if (this.nextItem) {
      this.imageStore.setColorRequested(this.nextItem.image_uri);
      this.imageStore.loadImage(this.nextItem.image_uri, ImageScale.BIG);
    }
    if (this.previousItem) {
      this.imageStore.setColorRequested(this.previousItem.image_uri);
      this.imageStore.loadImage(this.previousItem.image_uri, ImageScale.BIG);
    }
  }
}

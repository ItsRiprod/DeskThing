import SwipeHandler, { SwipeDirection } from 'component/Npv/SwipeHandler';
import NpvUbiLogger from 'eventhandler/NpvUbiLogger';
import { makeAutoObservable } from 'mobx';
import ImageStore from 'store/ImageStore';
import PlayerStore from 'store/PlayerStore';
import ViewStore from 'store/ViewStore';
import TimerStore from 'store/TimerStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import SavedStore from 'store/SavedStore';
import MiddlewareActions from 'middleware/MiddlewareActions';
import OtherMediaUbiLogger from 'component/Npv/OtherMedia/OtherMediaUbiLogger';
import PlayingInfoUiState from 'component/Npv/PlayingInfo/PlayingInfoUiState';
import VoiceStore from 'store/VoiceStore';
import { OverlayController } from 'component/Overlays/OverlayController';
import PermissionsStore from 'store/PermissionStore';
import PodcastSpeedUiState from 'component/Npv/PodcastSpeedOptions/PodcastSpeedUiState';

export enum SkipDirection {
  FORWARD,
  BACK,
}

export const SEEK_MS_PODCAST_EPISODE = 15000;

export type ControlButtonSet =
  | 'music'
  | 'podcast'
  | 'other_media'
  | 'music_ad'
  | 'free';

export default class ControlButtonsUiState {
  imageStore: ImageStore;
  playerStore: PlayerStore;
  timerStore: TimerStore;
  viewStore: ViewStore;
  swipeHandler: SwipeHandler;
  overlayController: OverlayController;
  remoteConfigStore: RemoteConfigStore;
  permissionsStore: PermissionsStore;
  podcastSpeedUiState: PodcastSpeedUiState;
  savedStore: SavedStore;
  voiceStore: VoiceStore;
  middlewareActions: MiddlewareActions;
  npvUbiLogger: NpvUbiLogger;
  otherMediaUbiLogger: OtherMediaUbiLogger;
  playingInfoUiState: PlayingInfoUiState;

  constructor(
    imageStore: ImageStore,
    playerStore: PlayerStore,
    timerStore: TimerStore,
    viewStore: ViewStore,
    swipeHandler: SwipeHandler,
    overlayController: OverlayController,
    remoteConfigStore: RemoteConfigStore,
    podcastSpeedUiState: PodcastSpeedUiState,
    savedStore: SavedStore,
    voiceStore: VoiceStore,
    middlewareActions: MiddlewareActions,
    npvUbiLogger: NpvUbiLogger,
    otherMediaUbiLogger: OtherMediaUbiLogger,
    playingInfoUiState: PlayingInfoUiState,
    permissionsStore: PermissionsStore,
  ) {
    this.imageStore = imageStore;
    this.playerStore = playerStore;
    this.timerStore = timerStore;
    this.viewStore = viewStore;
    this.swipeHandler = swipeHandler;
    this.overlayController = overlayController;
    this.remoteConfigStore = remoteConfigStore;
    this.podcastSpeedUiState = podcastSpeedUiState;
    this.savedStore = savedStore;
    this.voiceStore = voiceStore;
    this.middlewareActions = middlewareActions;
    this.npvUbiLogger = npvUbiLogger;
    this.otherMediaUbiLogger = otherMediaUbiLogger;
    this.playingInfoUiState = playingInfoUiState;
    this.permissionsStore = permissionsStore;

    makeAutoObservable(this);
  }

  get isPlaying() {
    return this.playerStore.playing;
  }

  get isPlayingSpotify() {
    return this.playerStore.isPlayingSpotify;
  }

  get isPlayingAd() {
    return this.playerStore.isPlayingAd;
  }

  get showMusicAdControls() {
    return (
      this.isPlayingAd &&
      !(this.playerStore.isPodcast || this.playerStore.isPodcastContext)
    );
  }

  get isShuffled() {
    return this.playerStore.shuffled;
  }

  get showPodcastControls() {
    return (
      this.playerStore.isPodcast ||
      (this.isPlayingAd && this.playerStore.isPodcastContext)
    );
  }

  get showOtherMediaControls() {
    return !this.isPlayingSpotify;
  }

  get showFreeMusicControls() {
    return this.permissionsStore.canPlayOnDemand === false;
  }

  get controlButtonSet(): ControlButtonSet {
    if (this.showMusicAdControls) {
      return 'music_ad';
    }
    if (this.showOtherMediaControls) {
      return 'other_media';
    }
    if (this.showPodcastControls) {
      return 'podcast';
    }
    if (this.showFreeMusicControls) {
      return 'free';
    }

    return 'music';
  }

  get podcastSpeed() {
    return this.podcastSpeedUiState.podcastSpeed;
  }

  get isSaved() {
    return this.savedStore.isSaved(this.playerStore.currentTrackUri);
  }

  get canSeek() {
    return this.playerStore.canSeek;
  }

  get isMicEnabled() {
    return !this.playingInfoUiState.isMicMuted;
  }

  handlePlayClick = () => {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logPlayButtonClicked(this.playerStore.currentTrackUri);
    } else {
      this.otherMediaUbiLogger.logPlayButtonClicked(
        this.playerStore.currentTrackUri,
      );
    }
    this.playerStore.setPlaying(true);
    this.playerStore.play();
  };

  handlePauseClick = () => {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logPauseButtonClicked(this.playerStore.currentTrackUri);
    } else {
      this.otherMediaUbiLogger.logPauseButtonClicked(
        this.playerStore.currentTrackUri,
      );
    }
    this.playerStore.setPlaying(false);
    this.playerStore.pause();
  };

  handleSkipPrevClick = () => {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logSkipPrevClicked(
        this.playerStore.currentTrackUri,
        this.timerStore.time,
        this.playerStore.currentTrackDuration,
      );
    } else {
      this.otherMediaUbiLogger.logSkipPrevClicked(
        this.playerStore.currentTrackUri,
        this.timerStore.time,
        this.playerStore.currentTrackDuration,
      );
    }
    this.playerStore.skipPrev();
    this.swipeHandler.setSwipeDirection(SwipeDirection.RIGHT);
  };

  handleSkipNextClick = () => {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logSkipNextClicked(
        this.playerStore.currentTrackUri,
        this.timerStore.time,
        this.playerStore.currentTrackDuration,
      );
    } else {
      this.otherMediaUbiLogger.logSkipNextClicked(
        this.playerStore.currentTrackUri,
        this.timerStore.time,
        this.playerStore.currentTrackDuration,
      );
    }
    this.playerStore.skipNext();
    this.swipeHandler.setSwipeDirection(SwipeDirection.LEFT);
  };

  handlePodcastSpeedClick = () => {
    this.npvUbiLogger.logPodcastSpeedClicked();
    this.overlayController.showPodcastSpeed();
  };

  handleShuffleClick = () => {
    this.playerStore.shuffle();
  };

  handleUnshuffleClick = () => {
    this.playerStore.unshuffle();
  };

  handleSeekBackClick = () => {
    this.npvUbiLogger.logSeekBackClicked();
    this.playerStore.seekBack(SEEK_MS_PODCAST_EPISODE);
  };

  handleSeekForwardClick = () => {
    this.npvUbiLogger.logSeekForwardClicked();
    this.playerStore.seekForward(SEEK_MS_PODCAST_EPISODE);
  };

  handleUnlikeClick = () => {
    this.npvUbiLogger.logRemoveLikeClicked(this.playerStore.currentTrackUri);
    this.savedStore.setSaved(this.playerStore.currentTrackUri, false);
  };

  handleLikeClick = () => {
    this.npvUbiLogger.logLikeClicked(this.playerStore.currentTrackUri);
    this.savedStore.setSaved(this.playerStore.currentTrackUri, true);
  };

  handleBlockClick = () => {
    // todo: call phone
    return null;
  };

  handleAddToSavedEpisodesClick = () => {
    this.npvUbiLogger.logLikeClicked(this.playerStore.currentTrackUri);
    this.savedStore.setSaved(this.playerStore.currentTrackUri, true);
  };

  handleRemoveFromSavedEpisodesClick = () => {
    this.npvUbiLogger.logRemoveLikeClicked(this.playerStore.currentTrackUri);
    this.savedStore.setSaved(this.playerStore.currentTrackUri, false);
  };
}

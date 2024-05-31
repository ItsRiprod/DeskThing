import { reaction, makeAutoObservable, computed } from 'mobx';
import InterappActions from 'middleware/InterappActions';
import { RootStore } from './RootStore';
import Socket from '../Socket';
import { ContextItem } from 'component/Tracklist/TracklistUiState';
import { titleBasedOnType } from 'helpers/ContextTitleExtractor';
import {
  isAdURI,
  isSearchURI,
  isShowURI,
  parseURI,
  URITypeMap,
} from '@spotify-internal/uri';
import { QueueItem } from './QueueStore';
import { isCollectionUri } from 'helpers/SpotifyUriUtil';

type MiddlewareEventMessage = {
  type: string;
  payload: PlayerStatePayload;
};

export type ActiveApp = {
  id: string; // Example: "Musik" for Swedish Apple Music
  name: string; // Example: "com.apple.Music"
};

export type Track = {
  album: {
    name: string;
    type: string;
    uri: string;
  };
  artist: {
    name: string;
    type: string;
    uri: string;
  };
  artists?: { name: string; uri: string }[];
  duration_ms: number;
  image_id: string;
  is_episode: boolean;
  is_podcast: boolean;
  name: string;
  saved: boolean;
  uri: string;
  uid?: string;
};
export type PlayerStatePayload = {
  context_title?: string;
  context_uri: string;
  currently_active_application?: ActiveApp;
  is_paused: 1 | 0 | boolean; // ios does 1/0, android true/false.
  is_paused_bool: boolean;
  playback_options: {
    repeat: 0 | 1 | 2; // 0 = off, 1 = one, 2 = all
    shuffle: boolean;
  };
  playback_position: number;
  playback_restrictions?: {
    can_repeat_context: boolean;
    can_repeat_track: boolean;
    can_seek: boolean;
    can_skip_next: boolean;
    can_skip_prev: boolean;
    can_toggle_shuffle: boolean;
  };
  playback_speed: number;
  playing_remotely: boolean;
  remote_device_id: string;
  track?: Track;
  type: string;
};

type State = PlayerStatePayload;

const getInitialTrack = (): Track => {
  return {
    album: {
      name: '',
      type: '',
      uri: '',
    },
    artist: {
      name: '',
      type: '',
      uri: '',
    },
    duration_ms: 0,
    image_id: '',
    is_episode: false,
    is_podcast: false,
    name: '',
    saved: false,
    uri: '',
  };
};
const getInitialState = (): State => {
  return {
    context_title: '',
    context_uri: '',
    is_paused: true,
    is_paused_bool: true,
    playback_options: {
      repeat: 0,
      shuffle: false,
    },
    playback_position: 0,
    playback_restrictions: {
      can_repeat_context: true,
      can_repeat_track: true,
      can_seek: true,
      can_skip_next: true,
      can_skip_prev: true,
      can_toggle_shuffle: true,
    },
    playback_speed: 1,
    playing_remotely: true,
    remote_device_id: '',
    track: getInitialTrack(),
    type: 'track',
  };
};

const shouldDropEvent = (playerState: PlayerStatePayload) => {
  return (
    playerState.context_uri === undefined || playerState.context_uri === null
  );
};

class PlayerStore {
  rootStore: RootStore;
  interappActions: InterappActions;

  constructor(
    rootStore: RootStore,
    interappActions: InterappActions,
    socket: Socket,
  ) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      otherActiveApp: computed.struct,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;

    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));

    this.onContextChange((contextUri) => {
      if (this.isPlayingSpotify) {
        this.rootStore.savedStore.loadSavedState(contextUri);
      }

      if (this.rootStore.remoteConfigStore.messageReceived) {
        this.rootStore.shelfStore.getShelfData();
      }
    });
  }

  state: State = getInitialState();
  currently_seeking?: number = undefined;
  podcastSpeed = 1;

  onMiddlewareEvent(msg: MiddlewareEventMessage) {
    switch (msg.type) {
      case 'com.spotify.superbird.player_state':
      case 'com.spotify.player_state':
        if (shouldDropEvent(msg.payload)) {
          return;
        }
        this.state = msg.payload;
        this.rootStore.overlayController.maybeShowAModal();
        this.updateTimer();
        this.updatePodcastSpeed();
        break;
      default:
        break;
    }
  }

  getRecentlyPlayed() {
    return this.interappActions.getRecentlyPlayed();
  }

  /**
   * Player state
   */
  get isPlayingSpotify() {
    return !this.state.currently_active_application;
  }

  get isPlayingOtherMedia() {
    return !this.isPlayingSpotify;
  }

  get playing() {
    return !this.state.is_paused;
  }

  get active() {
    return !this.state.playing_remotely;
  }

  get shuffled() {
    return this.state.playback_options.shuffle;
  }

  get onRepeat() {
    return this.state.playback_options.repeat === 2;
  }

  get onRepeatOnce() {
    return this.state.playback_options.repeat === 1;
  }

  get isPodcast() {
    return this.currentTrack.is_episode || this.currentTrack.is_podcast;
  }

  get isPodcastContext() {
    return isShowURI(this.contextUri);
  }

  get isPlayingAd() {
    return isAdURI(this.currentTrackUri);
  }

  get playbackSpeed() {
    return this.state.playback_speed;
  }

  get otherActiveApp() {
    return this.state.currently_active_application;
  }

  /**
   * Current Track
   */
  get currentTrack(): Track {
    return this.state.track || getInitialTrack();
  }

  get currentTrackDuration() {
    return this.currentTrack.duration_ms;
  }

  get currentTrackUri() {
    return this.currentTrack.uri;
  }

  get currentTrackUid() {
    return this.currentTrack.uid;
  }

  get currentTrackArtistName(): string {
    return this.currentTrack.artist?.name ?? '';
  }

  get currentTrackAlbumName(): string {
    return this.currentTrack.album?.name ?? '';
  }

  get currentImageId() {
    return this.currentTrack.image_id;
  }

  get contextTitle() {
    return this.state.context_title;
  }

  get contextUri(): string {
    if (
      isSearchURI(this.state.context_uri) ||
      this.rootStore.queueStore?.isCurrentProviderQueue
    ) {
      return this.currentTrackUri;
    }

    return this.state.context_uri ?? '';
  }

  get contextUriType() {
    if (isCollectionUri(this.contextUri)) {
      return URITypeMap.COLLECTION;
    }
    return parseURI(this.contextUri)?.type ?? '';
  }

  get currentContextItem(): ContextItem {
    return {
      uri: this.contextUri,
      title: titleBasedOnType(this, this.rootStore.queueStore),
      image_id: this.currentImageId,
    };
  }

  /**
   * Playback restrictions
   */
  get canSeek(): boolean {
    return !!this.state.playback_restrictions?.can_seek;
  }

  get canToggleShuffle(): boolean {
    if (!!this.state.playback_restrictions?.can_toggle_shuffle) {
      return this.currentTrack.uri !== '';
    }
    return false;
  }

  get canSkipNext(): boolean {
    if (this.isPlayingAd) {
      return false;
    }

    if (!!this.state.playback_restrictions?.can_skip_next) {
      return this.currentTrack.uri !== '';
    }
    return false;
  }

  get canSkipPrev(): boolean {
    if (this.isPlayingAd) {
      return false;
    }

    if (!!this.state.playback_restrictions?.can_skip_prev) {
      return this.currentTrack.uri !== '';
    }
    return false;
  }
  get canLike(): boolean {
    return this.currentTrack.uri !== '';
  }
  get canUnlike(): boolean {
    return this.currentTrack.uri !== '';
  }
  get canPlay(): boolean {
    return this.currentTrack.uri !== '';
  }
  get canPause(): boolean {
    return this.currentTrack.uri !== '';
  }
  get useSuperbirdEndpoints(): boolean {
    return this.rootStore.remoteConfigStore.useSuperbirdNamespace;
  }

  /**
   * Player actions
   */
  play() {
    if (this.useSuperbirdEndpoints) {
      this.interappActions.resume();
    } else {
      this.interappActions._setPlaybackSpeed(1);
    }
  }

  playItem(id: string, featureIdentifier: string, interactionId?: string) {
    if (this.useSuperbirdEndpoints) {
      this.interappActions.playUri(id, featureIdentifier, interactionId);
    } else {
      this.interappActions._playItem(id, featureIdentifier);
    }
  }

  playUriFromContext(
    contextUri: string,
    uri: string,
    featureIdentifier: string,
    interactionId: string,
    uid?: string,
  ) {
    if (this.useSuperbirdEndpoints) {
      this.interappActions.playUri(
        contextUri,
        featureIdentifier,
        interactionId,
        uri,
        uid,
      );
    } else {
      this.interappActions._playUriFromContext(
        contextUri,
        uri,
        featureIdentifier,
      );
    }
  }

  playPodcastTrailer(showUri: string) {
    this.interappActions.playPodcastTrailer(showUri);
  }

  pause() {
    if (this.useSuperbirdEndpoints) {
      this.interappActions.pause();
    } else {
      this.interappActions._setPlaybackSpeed(0);
    }
  }

  skipPrev() {
    if (this.canSkipPrev) {
      if (this.useSuperbirdEndpoints) {
        this.interappActions.skipPrevious(true);
      } else {
        this.interappActions._skipPrevious();
      }
    }
  }

  skipPrevForce() {
    if (this.canSkipPrev) {
      if (this.useSuperbirdEndpoints) {
        this.interappActions.skipPrevious(false);
      } else {
        this.interappActions._skipPreviousForce();
      }
    }
  }

  skipNext() {
    if (this.canSkipNext) {
      const nextTrack = this.rootStore.queueStore.nextItem;
      if (nextTrack && this.isPlayingSpotify) {
        this.setCurrentQueueItem(nextTrack);
      }
      if (this.useSuperbirdEndpoints) {
        this.interappActions.skipNext();
      } else {
        this.interappActions._skipNext();
      }
    }
  }
  private setCurrentQueueItem(newCurrentTrack: QueueItem) {
    this.rootStore.queueStore.setCurrentQueueItem(newCurrentTrack);
    this.rootStore.timerStore.setCurrentTime(0);
  }

  skipToIndex(index: number) {
    this.interappActions.skipToIndex(index);
  }

  shuffle = () => {
    if (this.canToggleShuffle) {
      this.setShuffle(true);
      this.rootStore.ubiLogger.npvUbiLogger.logShuffleEnableClicked();

      if (this.useSuperbirdEndpoints) {
        this.interappActions.setShuffle(true).catch(() => {
          this.setShuffle(false);
        });
      } else {
        this.interappActions._setShuffle(1).catch(() => {
          this.setShuffle(false);
        });
      }
    }
  };

  unshuffle = () => {
    if (this.canToggleShuffle) {
      this.setShuffle(false);
      this.rootStore.ubiLogger.npvUbiLogger.logShuffleDisableClicked();
      if (this.useSuperbirdEndpoints) {
        this.interappActions.setShuffle(false).catch(() => {
          this.setShuffle(true);
        });
      } else {
        this.interappActions._setShuffle(0).catch(() => {
          this.setShuffle(true);
        });
      }
    }
  };

  seek(position: number) {
    if (this.canSeek && this.currently_seeking === undefined) {
      if (this.useSuperbirdEndpoints) {
        this.interappActions.seekTo(position);
      } else {
        this.interappActions._seekToPosition(position);
      }
      this.currently_seeking = window.setTimeout(
        this.resetCurrentlySeeking,
        2000,
      );
    }
  }

  seekBack(seekedMs: number) {
    this.seek(this.rootStore.timerStore.time - seekedMs);
  }

  seekForward(seekedMs: number) {
    const seekToPosition = this.rootStore.timerStore.time + seekedMs;
    const seekWithinTrack = this.currentTrack.duration_ms > seekToPosition;
    if (this.canSkipNext && !seekWithinTrack) {
      this.skipNext();
    } else if (this.canSeek && seekWithinTrack) {
      this.seek(seekToPosition);
    } else if (this.canSeek) {
      this.seek(this.currentTrack.duration_ms);
    }
  }

  setPodcastSpeed(item: number) {
    this.podcastSpeed = item;
    this.interappActions.setPodcastPlaybackSpeed(item);
  }

  resetCurrentlySeeking() {
    if (this.currently_seeking !== undefined) {
      window.clearTimeout(this.currently_seeking);
      this.currently_seeking = undefined;
    }
  }

  updateTimer() {
    const { timerStore } = this.rootStore;
    timerStore.setMaxTime(this.currentTrack.duration_ms);
    timerStore.setCurrentTime(this.state.playback_position);

    if (this.state.is_paused) {
      timerStore.stop();
    } else {
      timerStore.start(1000);
    }
    this.resetCurrentlySeeking();
  }

  onContextChange(callback: (uri: string) => void) {
    reaction(
      () => this.contextUri,
      () => {
        if (this.contextUri) {
          callback(this.contextUri);
        }
      },
    );
  }

  /**
   * Change state
   */
  setIsPodcast(isPodcastContext: boolean) {
    this.currentTrack.is_podcast = isPodcastContext;
    this.currentTrack.is_episode = isPodcastContext;
  }

  updatePodcastSpeed() {
    const { timerStore } = this.rootStore;
    timerStore.setSpeed(this.playbackSpeed);

    const playbackSpeed = parseFloat(this.playbackSpeed.toFixed(1));
    if (playbackSpeed === this.podcastSpeed) return;
    this.podcastSpeed = playbackSpeed;
  }

  togglePlayPause() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  playIfPaused(): void {
    if (!this.playing) {
      this.play();
    }
  }

  onTrackChange(callback: (track: Track) => void) {
    reaction(
      () => this.currentTrack,
      () => callback(this.currentTrack),
    );
  }

  setPlaying(playing: boolean): void {
    this.state.is_paused = !playing;
  }

  setShuffle(shuffleState: boolean) {
    this.state.playback_options.shuffle = shuffleState;
  }

  setContextUri(contextUri: string) {
    this.state.context_uri = contextUri;
  }

  reset() {
    this.state = getInitialState();
  }
}

export default PlayerStore;

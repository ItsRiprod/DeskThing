import NpvUbiLogger from 'eventhandler/NpvUbiLogger';
import { get, makeAutoObservable } from 'mobx';
import ImageStore from 'store/ImageStore';
import PlayerStore from 'store/PlayerStore';
import TimerStore from 'store/TimerStore';

const SCRUBBING_VIEW_TIMEOUT = 3_000;

export default class ScrubbingUiState {
  imageStore: ImageStore;
  playerStore: PlayerStore;
  timerStore: TimerStore;
  npvUbiLogger: NpvUbiLogger;

  constructor(
    imageStore: ImageStore,
    playerStore: PlayerStore,
    timerStore: TimerStore,
    npvUbiLogger: NpvUbiLogger,
  ) {
    makeAutoObservable(this, {
      imageStore: false,
      playerStore: false,
      timerStore: false,
      npvUbiLogger: false,
    });

    this.imageStore = imageStore;
    this.playerStore = playerStore;
    this.timerStore = timerStore;
    this.npvUbiLogger = npvUbiLogger;
  }

  scrubbingTimeoutId?: number;
  isScrubbing = false; // TODO: Computed based on scrubbingTimeoutId

  get isScrubbingEnabled() {
    return this.playerStore.isPlayingSpotify;
  }

  get colorChannels() {
    return (
      get(this.imageStore.colors, this.playerStore.currentTrack.image_id) || [
        0, 0, 0,
      ]
    );
  }

  get trackPlayedPercent() {
    return this.timerStore.trackPlayedPercent;
  }

  get trackPlayedTime() {
    return this.timerStore.trackPlayedTime;
  }

  get trackLeftTime() {
    return this.timerStore.trackLeftTime;
  }

  startScrubbing() {
    this.isScrubbing = true;
    if (this.playerStore.playing) {
      this.timerStore.stop();
    }
    this.resetScrubbingViewTimer();
  }

  stopScrubbing = () => {
    this.isScrubbing = false;
    if (this.playerStore.playing) {
      this.timerStore.start();
    }
    window.clearTimeout(this.scrubbingTimeoutId);
  };

  resetScrubbingViewTimer() {
    window.clearTimeout(this.scrubbingTimeoutId);
    this.scrubbingTimeoutId = window.setTimeout(
      this.stopScrubbing,
      SCRUBBING_VIEW_TIMEOUT,
    );
  }

  handleScrubberClick = () => {
    this.npvUbiLogger.logOpenScrubber();
    this.startScrubbing();
  };

  handleOnTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    this.startScrubbing();

    const x = e.touches[0].clientX;
    const time = (x / 800) * this.timerStore.maxTimeMs;
    this.timerStore.setCurrentTime(time);
  };

  handleScrubbingBackdropOnTouchEnd = () => {
    const trackTime = this.timerStore.trackTime;
    this.npvUbiLogger.logSeekToTimeScrubber(trackTime);
    this.playerStore.seek(trackTime);
  };
}

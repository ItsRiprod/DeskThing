import NpvUbiLogger from 'eventhandler/NpvUbiLogger';
import { runInAction } from 'mobx';
import PlayerStore from 'store/PlayerStore';
import TimerStore from 'store/TimerStore';

export enum SwipeDirection {
  NONE,
  LEFT,
  RIGHT,
}

export default class SwipeHandler {
  swipeDirection: SwipeDirection = SwipeDirection.NONE;
  playerStore: PlayerStore;
  timerStore: TimerStore;
  npvUbiLogger: NpvUbiLogger;

  constructor(
    playerStore: PlayerStore,
    timerStore: TimerStore,
    npvUbiLogger: NpvUbiLogger,
  ) {
    this.playerStore = playerStore;
    this.timerStore = timerStore;
    this.npvUbiLogger = npvUbiLogger;
  }

  setSwipeDirection(direction: SwipeDirection) {
    this.swipeDirection = direction;
  }

  handleSwipedLeft = () => {
    if (this.playerStore.currentTrack.uri) {
      runInAction(() => {
        this.npvUbiLogger.logSwipeSkipNext(
          this.playerStore.currentTrackUri,
          this.timerStore.time,
          this.playerStore.currentTrackDuration,
        );
      });
    }
    this.setSwipeDirection(SwipeDirection.LEFT);
    this.playerStore.skipNext();
  };

  handleSwipedRight = () => {
    if (this.playerStore.currentTrack.uri) {
      runInAction(() => {
        return this.npvUbiLogger.logSwipeSkipPrevious(
          this.playerStore.currentTrackUri,
          this.timerStore.time,
          this.playerStore.currentTrackDuration,
        );
      });
    }
    this.setSwipeDirection(SwipeDirection.RIGHT);
    this.playerStore.skipPrevForce();
  };
}

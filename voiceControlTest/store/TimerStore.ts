import { makeAutoObservable } from 'mobx';
import { msToTime, msToMinutes } from 'helpers/TimeUtils';
import { RootStore } from './RootStore';

enum TimerStatus {
  STOPPED,
  RUNNING,
}

class TimerStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      timerId: false,
      maxTimeMs: false,
      status: false,
    });

    this.rootStore = rootStore;
  }

  maxTimeMs = 1;
  time = 0;
  speed = 1;
  status: TimerStatus = TimerStatus.STOPPED;
  timerId?: number;

  setCurrentTime(timeMs: number) {
    this.time = timeMs;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  start(interval = 1000) {
    // TODO: replace timer calculation with one that doesn't drift over time.
    this.maxTimeMs = this.rootStore.playerStore.currentTrackDuration;
    const intervalTimer = interval || 1000;

    if (this.status === TimerStatus.STOPPED) {
      this.status = TimerStatus.RUNNING;
      this.timerId = window.setInterval(
        () => this.tick(intervalTimer),
        intervalTimer,
      );
    }
  }

  tick(intervalTimer: number) {
    if (this.time < this.maxTimeMs) {
      this.time += intervalTimer * this.speed;
      this.maxTimeMs = this.rootStore.playerStore.currentTrackDuration;
    }
  }

  stop() {
    if (this.status === TimerStatus.RUNNING) {
      this.status = TimerStatus.STOPPED;
      clearInterval(this.timerId);
    }
  }

  reset(ms = 0) {
    this.time = ms;
    this.status = TimerStatus.STOPPED;
    clearInterval(this.timerId);
  }

  get trackTime() {
    return this.time;
  }

  get trackMaxTimeMs() {
    return this.maxTimeMs;
  }

  get trackPlayedPercent() {
    return (this.time / this.maxTimeMs) * 100;
  }

  get trackPlayedTime() {
    return msToTime(this.time);
  }

  get trackLeftTime() {
    return msToTime(this.maxTimeMs - this.time);
  }

  get trackLeftMinutes() {
    return msToMinutes(this.maxTimeMs - this.time);
  }

  setMaxTime(length: number) {
    this.maxTimeMs = length;
  }
}

export default TimerStore;

import { RootStore } from './RootStore';
import { makeAutoObservable } from 'mobx';
import Socket from 'Socket';
import InterappActions from 'middleware/InterappActions';

type PodcastPlaybackSpeed = {
  podcast_playback_speed: number;
};

type MiddlewareEventMessage = {
  type: string;
  payload: PodcastPlaybackSpeed;
};

class PodcastSpeedStore {
  rootStore: RootStore;
  interappActions: InterappActions;
  constructor(
    rootStore: RootStore,
    interappActions: InterappActions,
    socket: Socket,
  ) {
    makeAutoObservable(this, { rootStore: false, interappActions: false });
    this.rootStore = rootStore;
    this.interappActions = interappActions;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  podcastSpeed: number | undefined;

  onMiddlewareEvent(msg: MiddlewareEventMessage) {
    switch (msg.type) {
      case 'com.spotify.podcast_playback_speed':
        if (msg.payload) {
          this.updatePodcastSpeed(msg.payload.podcast_playback_speed);
        }
        break;
      default:
        break;
    }
  }

  updatePodcastSpeed(speed: number) {
    const { timerStore } = this.rootStore;
    timerStore.setSpeed(speed);
    this.podcastSpeed = parseFloat(speed.toFixed(1));
  }

  setPodcastSpeed(item: number) {
    this.podcastSpeed = item;
    this.interappActions.setPodcastPlaybackSpeed(item);
  }
}

export default PodcastSpeedStore;

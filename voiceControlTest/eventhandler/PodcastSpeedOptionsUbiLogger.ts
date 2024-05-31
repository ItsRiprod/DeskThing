import {
  CarPodcastSpeedViewCarthingosEventFactory,
  createCarPodcastSpeedViewCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-podcast-speed-view-carthingos/CarPodcastSpeedViewCarthingosEventFactory';
import UbiLogger from './UbiLogger';

class PodcastSpeedOptionsUbiLogger {
  ubiLogger: UbiLogger;
  carPodcastSpeedViewCarthingosEventFactory: CarPodcastSpeedViewCarthingosEventFactory;
  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carPodcastSpeedViewCarthingosEventFactory =
      createCarPodcastSpeedViewCarthingosEventFactory();
  }
  logPodcastSpeedViewBackButton = () => {
    const event = this.carPodcastSpeedViewCarthingosEventFactory
      .backButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logPodcastSpeedItemClicked = (
    currentlyPlayedItem: string,
    playbackSpeed: number,
  ) => {
    const event = this.carPodcastSpeedViewCarthingosEventFactory
      .speedOptionFactory()
      .hitSetPlaybackSpeed({
        currentlyPlayedItem,
        playbackSpeed,
      });
    this.ubiLogger.logInteraction(event);
  };

  logPodcastSpeedItemDialPressed = (
    currentlyPlayedItem: string,
    playbackSpeed: number,
  ) => {
    const event = this.carPodcastSpeedViewCarthingosEventFactory
      .speedOptionFactory()
      .keyStrokeSetPlaybackSpeed({
        currentlyPlayedItem,
        playbackSpeed,
      });
    this.ubiLogger.logInteraction(event);
  };
}

export default PodcastSpeedOptionsUbiLogger;

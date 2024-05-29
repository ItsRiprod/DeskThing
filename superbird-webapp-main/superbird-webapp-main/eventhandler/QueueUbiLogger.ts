import UbiLogger from './UbiLogger';
import {
  CarQueueCarthingosEventFactory,
  createCarQueueCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-queue-carthingos';

class QueueUbiLogger {
  ubiLogger: UbiLogger;
  queueEventFactory: CarQueueCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.queueEventFactory = createCarQueueCarthingosEventFactory();
  }

  logImpression = () => {
    const event = this.queueEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logTrackRowClicked = (index: number, uri: string): string => {
    const event = this.queueEventFactory
      .trackRowFactory({ position: index, uri: uri })
      .hitPlay({ itemToBePlayed: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logDialPressTrackRow = (index: number, uri: string): string => {
    const event = this.queueEventFactory
      .dialButtonFactory({ position: index, uri: uri })
      .keyStrokePlay({ itemToBePlayed: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logBackButtonPressed = () => {
    const event = this.queueEventFactory
      .backButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };
}

export default QueueUbiLogger;

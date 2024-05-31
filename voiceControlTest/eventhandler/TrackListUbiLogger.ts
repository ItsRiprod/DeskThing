import { createCarTrackViewCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-track-view-carthingos/CarTrackViewCarthingosEventFactory';
import UbiLogger from './UbiLogger';

class TrackListUbiLogger {
  ubiLogger: UbiLogger;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
  }

  logImpression = (contextUri: string) => {
    const event =
      TrackListUbiLogger.createEventFactory(contextUri).impression();
    this.ubiLogger.logImpression(event);
  };

  logTracklistItemImpression = (
    contextUri: string,
    trackUri: string,
    position: number,
  ) => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .trackRowFactory({ position, uri: trackUri })
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logContextLiked = (contextUri: string) => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .saveButtonFactory()
      .hitLike({ itemToBeLiked: contextUri });
    this.ubiLogger.logInteraction(event);
  };

  logContextRemoveLike = (contextUri: string) => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .saveButtonFactory()
      .hitRemoveLike({
        itemNoLongerLiked: contextUri,
      });
    this.ubiLogger.logInteraction(event);
  };

  logAddToQueueDialLongPress = (
    index: number,
    uri: string,
    contextUri: string,
  ) => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .trackRowFactory({ position: index, uri: uri })
      .longHitAddItemToQueue({ itemToAddToQueue: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logAddToQueueClicked = (index: number, uri: string, contextUri: string) => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .trackRowFactory({ position: index, uri: uri })
      .addToQueueButtonFactory()
      .hitAddItemToQueue({ itemToAddToQueue: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logTrackRowClicked = (
    index: number,
    uri: string,
    contextUri: string,
  ): string => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .trackRowFactory({ position: index, uri: uri })
      .hitPlay({ itemToBePlayed: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logDialPressTrackRow = (
    index: number,
    uri: string,
    contextUri: string,
  ): string => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .dialButtonFactory({ position: index, uri: uri })
      .keyStrokePlay({ itemToBePlayed: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logBackButtonPressed = (contextUri: string) => {
    const event = TrackListUbiLogger.createEventFactory(contextUri)
      .backButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  private static createEventFactory(contextUri: string) {
    return createCarTrackViewCarthingosEventFactory({
      data: {
        uri: contextUri,
      },
    });
  }
}

export default TrackListUbiLogger;

import {
  CarContentShelfCarthingosEventFactory,
  createCarContentShelfCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-content-shelf-carthingos/CarContentShelfCarthingosEventFactory';
import UbiLogger from './UbiLogger';

class ContentShelfUbiLogger {
  ubiLogger: UbiLogger;
  carContentShelfCarthingosEventFactory: CarContentShelfCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carContentShelfCarthingosEventFactory =
      createCarContentShelfCarthingosEventFactory();
  }

  logImpression = () => {
    const event = this.carContentShelfCarthingosEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logVoiceMutedBannerImpression = () => {
    const event = this.carContentShelfCarthingosEventFactory
      .voiceMutedBannerFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logMicUnMutedClicked = () => {
    const event = this.carContentShelfCarthingosEventFactory
      .voiceMutedBannerFactory()
      .turnOnMicButtonFactory()
      .hitSettingEnable();
    this.ubiLogger.logInteraction(event);
  };

  logDialButtonPressed = (
    category: string,
    index: number,
    uri?: string,
  ): string | undefined => {
    if (uri) {
      const event = this.carContentShelfCarthingosEventFactory
        .categoryShelfRowFactory({ uri: category })
        .dialButtonFactory({ position: index, uri: uri })
        .keyStrokeUiNavigate({ destination: uri });
      return this.ubiLogger.logInteraction(event);
    }
    return undefined;
  };

  logShelfScrolledByTouch = () => {
    // TODO (andreasp): Consider if we want this. Is it useful?
  };

  logDialButtonRotated = () => {
    // TODO (andreasp): Consider if we want this. This will flood our logs. Is it useful?
    // const event = this.carContentShelfCarthingosEventFactory
    //   .dialRotate()
    //   .rotateUiReveal();
    // this.ubiLogger.sendUbiInteraction(event);
  };

  logBackButtonPressed = () => {
    const event = this.carContentShelfCarthingosEventFactory
      .backButtonFactory()
      .keyStrokeUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logShelfArtworkImpression = (
    category: string,
    position: number,
    uri: string,
  ) => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .shelfItemCardFactory({ position, uri })
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logShelfItemClicked = (
    category: string,
    index: number,
    uri: string,
  ): string => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .shelfItemCardFactory({ position: index, uri: uri })
      .hitUiNavigate({ destination: uri });
    return this.ubiLogger.logInteraction(event);
  };

  logQuickScrollClicked = (category: string | undefined) => {
    if (category) {
      const event = this.carContentShelfCarthingosEventFactory
        .categoryShelfRowFactory({ uri: category })
        .hitQuickScroll();
      this.ubiLogger.logInteraction(event);
    }
  };

  logMoreButtonImpression = (category: string) => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .moreButtonFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logMoreButtonClicked = (category: string) => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .moreButtonFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logMoreButtonDialPressed = (category: string): string => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .moreButtonFactory()
      .keyStrokeUiReveal();
    return this.ubiLogger.logInteraction(event);
  };

  logPushToTalkButtonImpression = (category: string) => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .pushToTalkButtonFactory()
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logPushToTalkButtonClicked = (category: string) => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .pushToTalkButtonFactory()
      .hitUiReveal();
    this.ubiLogger.logInteraction(event);
  };

  logPushToTalkButtonDialPressed = (category: string) => {
    const event = this.carContentShelfCarthingosEventFactory
      .categoryShelfRowFactory({ uri: category })
      .pushToTalkButtonFactory()
      .keyStrokeUiReveal();
    return this.ubiLogger.logInteraction(event);
  };
}

export default ContentShelfUbiLogger;

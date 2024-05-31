import {
  CarVoiceViewCarthingosEventFactory,
  createCarVoiceViewCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-voice-view-carthingos/CarVoiceViewCarthingosEventFactory';
import UbiLogger from './UbiLogger';

class VoiceUbiLogger {
  ubiLogger: UbiLogger;
  carVoiceCarthingosEventFactory: CarVoiceViewCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.carVoiceCarthingosEventFactory =
      createCarVoiceViewCarthingosEventFactory();
  }

  logVoiceImpression = () => {
    const event = this.carVoiceCarthingosEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logSwipeCancelVoiceRequest = () => {
    const event = this.carVoiceCarthingosEventFactory.swipeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logBackDismissVoiceOverlay = () => {
    const event = this.carVoiceCarthingosEventFactory
      .backButtonFactory()
      .keyStrokeUiHide();
    this.ubiLogger.logInteraction(event);
  };

  logErrorImpression = (reason: string) => {
    const event = this.carVoiceCarthingosEventFactory
      .errorFactory({ reason })
      .impression();
    this.ubiLogger.logImpression(event);
  };

  logErrorTryAgain = (reason: string) => {
    const event = this.carVoiceCarthingosEventFactory
      .errorFactory({ reason })
      .hitRetry();
    this.ubiLogger.logInteraction(event);
  };
}

export default VoiceUbiLogger;

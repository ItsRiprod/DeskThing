import UbiLogger from './UbiLogger';
import {
  CarPhoneCallCarthingosEventFactory,
  createCarPhoneCallCarthingosEventFactory,
} from '@spotify-internal/ubi-sdk-music-car-phone-call-carthingos';

class PhoneCallUbiLogger {
  ubiLogger: UbiLogger;
  phoneCallEventFactory: CarPhoneCallCarthingosEventFactory;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
    this.phoneCallEventFactory = createCarPhoneCallCarthingosEventFactory();
  }

  logPhoneCallImpression = () => {
    const event = this.phoneCallEventFactory.impression();
    this.ubiLogger.logImpression(event);
  };

  logAnswerButtonClicked = () => {
    const event = this.phoneCallEventFactory
      .answerButtonFactory()
      .hitAnswerPhoneCall();
    return this.ubiLogger.logInteraction(event);
  };

  logDeclineButtonClicked = () => {
    const event = this.phoneCallEventFactory
      .declineButtonFactory()
      .hitDeclinePhoneCall();
    return this.ubiLogger.logInteraction(event);
  };

  logHangUpButtonClicked = () => {
    const event = this.phoneCallEventFactory
      .hangUpButtonFactory()
      .hitHangUpPhoneCall();
    return this.ubiLogger.logInteraction(event);
  };
}

export default PhoneCallUbiLogger;

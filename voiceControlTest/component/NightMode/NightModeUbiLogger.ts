import UbiLogger from 'eventhandler/UbiLogger';
import { createCarNightModeCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-night-mode-carthingos';

class NightModeUbiLogger {
  ubiLogger: UbiLogger;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
  }

  logNightModeImpression = (reason: string) => {
    const event = createCarNightModeCarthingosEventFactory({
      data: { reason: reason },
    }).impression();
    this.ubiLogger.logImpression(event);
  };
}

export default NightModeUbiLogger;

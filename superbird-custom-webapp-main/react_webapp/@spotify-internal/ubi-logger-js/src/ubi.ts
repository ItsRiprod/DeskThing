import { UBILogger, UBILoggerOptions } from './loggers/UBILogger';

export const UBI = (function fn() {
  let ubiLogger: UBILogger;

  function initUBILogger(options: UBILoggerOptions) {
    if (ubiLogger) {
      ubiLogger.unregisterEventListeners();
    }

    ubiLogger = new UBILogger(options);
    ubiLogger.registerEventListeners();
    return ubiLogger;
  }

  return {
    getUBILogger: function getUBILoggerFn(options: UBILoggerOptions) {
      return initUBILogger(options);
    },
  };
})();

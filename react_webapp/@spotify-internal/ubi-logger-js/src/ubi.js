import { UBILogger } from './loggers/UBILogger';
export const UBI = (function fn() {
    let ubiLogger;
    function initUBILogger(options) {
        if (ubiLogger) {
            ubiLogger.unregisterEventListeners();
        }
        ubiLogger = new UBILogger(options);
        ubiLogger.registerEventListeners();
        return ubiLogger;
    }
    return {
        getUBILogger: function getUBILoggerFn(options) {
            return initUBILogger(options);
        },
    };
})();

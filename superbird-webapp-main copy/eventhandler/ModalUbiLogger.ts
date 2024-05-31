import UbiLogger from './UbiLogger';
import { createCarNonCriticalOtaModalCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-non-critical-ota-modal-carthingos';
import { createCarSetupCriticalOtaCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-setup-critical-ota-carthingos';
import { createCarLetsDriveModalCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-lets-drive-modal-carthingos';
import { createCarPinPairingCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-pin-pairing-carthingos';
import { createCarNoBluetoothConnectionCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-no-bluetooth-connection-carthingos';
import { createCarNeedPremiumModalCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-need-premium-modal-carthingos';
import { createCarSettingsPowerModalCarthingosEventFactory } from '@spotify-internal/ubi-sdk-music-car-settings-power-modal-carthingos';
import { MainMenuItemId } from 'store/SettingsStore';

class ModalUbiLogger {
  ubiLogger: UbiLogger;

  constructor(ubiLogger: UbiLogger) {
    this.ubiLogger = ubiLogger;
  }

  logStandbyImpression = () => {
    const event =
      createCarSettingsPowerModalCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };

  logStandbyConfirm = () => {
    const event = createCarSettingsPowerModalCarthingosEventFactory()
      .powerOffButtonFactory()
      .hitPowerOff();
    this.ubiLogger.logInteraction(event);
  };

  logStandbyCancel = () => {
    const event = createCarSettingsPowerModalCarthingosEventFactory()
      .cancelButtonFactory()
      .hitUiNavigateBack();
    this.ubiLogger.logInteraction(event);
  };

  logOtaNonCriticalImpression = () => {
    const event =
      createCarNonCriticalOtaModalCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };

  logSetupCriticalOtaImpression = () => {
    const event =
      createCarSetupCriticalOtaCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };

  logLetsDriveImpression = () => {
    const event = createCarLetsDriveModalCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };

  logBluetoothPinPairingImpression = () => {
    const event = createCarPinPairingCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };

  logNoConnectionModalImpression = () => {
    const event =
      createCarNoBluetoothConnectionCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };

  logGoToPhoneListDialPress = () => {
    const event = createCarNoBluetoothConnectionCarthingosEventFactory()
      .showPairedPhonesButtonFactory()
      .keyStrokeUiNavigate({
        destination: MainMenuItemId.PHONE_CONNECTION,
      });
    this.ubiLogger.logInteraction(event);
  };

  logGoToPhoneListClick = () => {
    const event = createCarNoBluetoothConnectionCarthingosEventFactory()
      .showPairedPhonesButtonFactory()
      .hitUiNavigate({
        destination: MainMenuItemId.PHONE_CONNECTION,
      });
    this.ubiLogger.logInteraction(event);
  };

  logNeedPremiumModalShown = () => {
    const event =
      createCarNeedPremiumModalCarthingosEventFactory().impression();
    this.ubiLogger.logImpression(event);
  };
}

export default ModalUbiLogger;

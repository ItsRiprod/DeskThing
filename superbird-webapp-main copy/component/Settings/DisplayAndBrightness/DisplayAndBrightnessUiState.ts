import SettingsUbiLogger from 'component/Settings/SettingsUbiLogger';
import NightModeController from 'component/NightMode/NightModeController';
import { makeAutoObservable } from 'mobx';

export type DisplayAndBrightnessUiState = ReturnType<
  typeof createDisplayAndBrightnessUiState
>;

const createDisplayAndBrightnessUiState = (
  nightModeController: NightModeController,
  settingsUbiLogger: SettingsUbiLogger,
) => {
  return makeAutoObservable({
    get isNightMode() {
      return nightModeController.isNightMode;
    },

    handleDialPress(): void {
      if (this.isNightMode) {
        settingsUbiLogger.logNightModeDialPressedDisable();
      } else {
        settingsUbiLogger.logNightModeDialPressedEnable();
      }
      nightModeController.toggleNightMode();
    },

    handleClickToggle(): void {
      if (this.isNightMode) {
        settingsUbiLogger.logNightModeClickDisable();
      } else {
        settingsUbiLogger.logNightModeClickEnable();
      }
      nightModeController.toggleNightMode();
    },

    logImpression() {
      settingsUbiLogger.logNightModeViewImpression();
    },
  });
};

export default createDisplayAndBrightnessUiState;

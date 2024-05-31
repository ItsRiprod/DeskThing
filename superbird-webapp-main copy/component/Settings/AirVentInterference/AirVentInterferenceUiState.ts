import { makeAutoObservable } from 'mobx';
import HardwareStore from 'store/HardwareStore';
import WindLevelStore from 'store/WindLevelStore';
import SettingsUbiLogger from 'component/Settings/SettingsUbiLogger';
import SettingsStore from 'store/SettingsStore';
import { OverlayController } from 'component/Overlays/OverlayController';

export default class AirVentInterferenceUiState {
  settingsStore: SettingsStore;
  hardwareStore: HardwareStore;
  overlayController: OverlayController;
  windLevelStore: WindLevelStore;
  settingsUbiLogger: SettingsUbiLogger;

  constructor(
    settingsStore: SettingsStore,
    hardwareStore: HardwareStore,
    overlayController: OverlayController,
    windLevelStore: WindLevelStore,
    settingsUbiLogger: SettingsUbiLogger,
  ) {
    makeAutoObservable(this, {
      settingsStore: false,
      hardwareStore: false,
      overlayController: false,
      windLevelStore: false,
      settingsUbiLogger: false,
    });

    this.settingsStore = settingsStore;
    this.hardwareStore = hardwareStore;
    this.overlayController = overlayController;
    this.windLevelStore = windLevelStore;
    this.settingsUbiLogger = settingsUbiLogger;
  }

  airVentContainerScrollStep = 0;

  get airVentAlertsDisabled(): boolean {
    return this.windLevelStore.alertDisabled;
  }

  get highlightOption(): boolean {
    return (
      this.airVentContainerScrollStep === 0 && this.hardwareStore.dialPressed
    );
  }

  get isNotificationStep(): boolean {
    return this.airVentContainerScrollStep === 0;
  }

  setAirVentInterferenceScrollStep(newStep: number) {
    this.overlayController.showSettings();
    let actualStep = newStep;

    if (newStep > 2.7) {
      actualStep = 2;
    } else if (newStep < 0.4) {
      actualStep = 0;
    }
    this.airVentContainerScrollStep = actualStep;
  }

  toggleNotification(): void {
    if (this.windLevelStore.alertDisabled) {
      this.settingsUbiLogger.logAirVentInterferenceClickEnable();
    } else {
      this.settingsUbiLogger.logAirVentInterferenceClickDisable();
    }
    this.windLevelStore.toggleAlertDisabledByUser();
  }

  showOnlyAirVentInterference() {
    this.settingsStore.viewStack = [this.settingsStore.airVentInterferenceView];
  }

  logImpression() {
    this.settingsUbiLogger.logAirVentInterferenceViewImpression();
  }

  handleDialPress() {
    if (this.airVentContainerScrollStep === 0) {
      if (this.windLevelStore.alertDisabled) {
        this.settingsUbiLogger.logAirVentInterferenceDialPressedEnable();
      } else {
        this.settingsUbiLogger.logAirVentInterferenceDialPressedDisable();
      }
      this.windLevelStore.toggleAlertDisabledByUser();
    }
  }

  handleDialRight() {
    this.setAirVentInterferenceScrollStep(this.airVentContainerScrollStep + 1);
  }

  handleDialLeft() {
    this.setAirVentInterferenceScrollStep(this.airVentContainerScrollStep - 1);
  }

  resetAirVentContainerScrollStep() {
    this.airVentContainerScrollStep = 0;
  }
}

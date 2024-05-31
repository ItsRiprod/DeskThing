import AirVentInterferenceUiState from 'component/Settings/AirVentInterference/AirVentInterferenceUiState';
import WindAlertBannerUiState from 'component/Npv/WindAlertBanner/WindAlertBannerUiState';
import { RootStore } from 'store/RootStore';

class AirVentInterferenceController {
  rootStore: RootStore;
  airVentInterferenceUiState: AirVentInterferenceUiState;
  windAlertBannerUiState: WindAlertBannerUiState;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.airVentInterferenceUiState = new AirVentInterferenceUiState(
      rootStore.settingsStore,
      rootStore.hardwareStore,
      rootStore.overlayController,
      rootStore.windLevelStore,
      rootStore.ubiLogger.settingsUbiLogger,
    );

    this.windAlertBannerUiState = new WindAlertBannerUiState(
      this,
      rootStore.windLevelStore,
      rootStore.voiceStore,
      rootStore.overlayController,
      rootStore.remoteConfigStore,
      rootStore.playerStore,
      rootStore.ubiLogger.npvUbiLogger,
      rootStore.ubiLogger.otherMediaUbiLogger,
      rootStore.persistentStorage,
    );
  }

  handleDialPress(): void {
    this.airVentInterferenceUiState.handleDialPress();
  }

  handleDialRight(): void {
    this.airVentInterferenceUiState.handleDialRight();
  }

  handleDialLeft(): void {
    this.airVentInterferenceUiState.handleDialLeft();
  }

  goStraightToAirVentInterference(): void {
    this.rootStore.settingsStore.showOnlyAirVentInterference();
  }
}

export default AirVentInterferenceController;

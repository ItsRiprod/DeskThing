import { makeAutoObservable, runInAction } from 'mobx';
import WindLevelStore from 'store/WindLevelStore';
import NpvUbiLogger from 'eventhandler/NpvUbiLogger';
import VoiceStore from 'store/VoiceStore';
import RemoteConfigStore from 'store/RemoteConfigStore';
import AirVentInterferenceController from 'component/Npv/WindAlertBanner/AirVentInterferenceController';
import PlayerStore from 'store/PlayerStore';
import OtherMediaUbiLogger from 'component/Npv/OtherMedia/OtherMediaUbiLogger';
import { OverlayController } from 'component/Overlays/OverlayController';
import SeedableStorageInterface from 'middleware/SeedableStorageInterface';
export const WIND_NOISE_ALERT_DISMISSED_KEY = 'wind_noise_alert_dismissed-date';

export default class WindAlertBannerUiState {
  airVentInterferenceController: AirVentInterferenceController;
  windLevelStore: WindLevelStore;
  voiceStore: VoiceStore;
  overlayController: OverlayController;
  remoteConfigStore: RemoteConfigStore;
  playerStore: PlayerStore;
  npvUbiLogger: NpvUbiLogger;
  otherMediaUbiLogger: OtherMediaUbiLogger;
  persistentStorage: SeedableStorageInterface;
  showingAlert = false;

  dismissTime = 24;
  dismissed = false;

  constructor(
    airVentInterferenceController: AirVentInterferenceController,
    windLevelStore: WindLevelStore,
    voiceStore: VoiceStore,
    overlayController: OverlayController,
    remoteConfigStore: RemoteConfigStore,
    playerStore: PlayerStore,
    npvUbiLogger: NpvUbiLogger,
    otherMediaUbiLogger: OtherMediaUbiLogger,
    persistentStorage: SeedableStorageInterface,
  ) {
    this.airVentInterferenceController = airVentInterferenceController;
    this.windLevelStore = windLevelStore;
    this.voiceStore = voiceStore;
    this.overlayController = overlayController;
    this.remoteConfigStore = remoteConfigStore;
    this.playerStore = playerStore;
    this.npvUbiLogger = npvUbiLogger;
    this.otherMediaUbiLogger = otherMediaUbiLogger;
    this.persistentStorage = persistentStorage;

    makeAutoObservable(this, {
      airVentInterferenceController: false,
      windLevelStore: false,
      voiceStore: false,
      overlayController: false,
      remoteConfigStore: false,
      playerStore: false,
      npvUbiLogger: false,
      otherMediaUbiLogger: false,
      showingAlert: false,
    });

    runInAction(() => {
      this.dismissed = this.getStoredDismissedStatus();
    });

    this.windLevelStore.onWindLvlOverThreshold(() => {
      runInAction(() => {
        this.dismissed = this.getStoredDismissedStatus();
      });
    });
  }

  get dismissAlertTimeDelay(): number {
    return this.dismissTime;
  }

  get shouldShowIcon(): boolean {
    return (
      this.windLevelStore.currentWindLevel >=
        this.windLevelStore.windAlertOnThreshold && !this.voiceStore.isMicMuted
    );
  }

  logImpression() {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logWindNoiseImpression();
    } else {
      this.otherMediaUbiLogger.logWindNoiseImpression();
    }
  }

  handleClickHowToFix() {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logWindNoiseLearnMore();
    } else {
      this.otherMediaUbiLogger.logWindNoiseLearnMore();
    }
    this.airVentInterferenceController.goStraightToAirVentInterference();
    this.overlayController.showSettings();
    this.removeAlertBanner();
  }

  handleClickHide() {
    if (this.playerStore.isPlayingSpotify) {
      this.npvUbiLogger.logWindNoiseDismissal();
    } else {
      this.otherMediaUbiLogger.logWindNoiseDismissal();
    }
    this.setUserDismissedAlertAt();
    this.removeAlertBanner();
  }

  removeAlertBanner() {
    this.dismissed = true;
    this.showingAlert = false;
  }

  get shouldShowAlert(): boolean {
    const alwaysHide =
      this.dismissed ||
      this.windLevelStore.alertDisabled ||
      this.voiceStore.isMicMuted;

    if (alwaysHide) {
      return false;
    } else if (!this.showingAlert && this.windLevelStore.isOverThreshold) {
      this.showingAlert = true;
      return true;
    } else if (this.showingAlert) {
      return true;
    }
    return false;
  }

  getStoredDismissedStatus(): boolean {
    const dismissedDate = this.persistentStorage.getItem(
      WIND_NOISE_ALERT_DISMISSED_KEY,
    );

    if (dismissedDate) {
      const hoursInMS = 60 * 60 * this.dismissAlertTimeDelay * 1000;
      const disabledUntilDate = parseInt(dismissedDate, 10) + hoursInMS;
      return disabledUntilDate >= Date.now();
    }
    return false;
  }

  setUserDismissedAlertAt() {
    this.persistentStorage.setItem(
      WIND_NOISE_ALERT_DISMISSED_KEY,
      JSON.stringify(Date.now()),
    );
  }
}

import { makeAutoObservable, reaction } from 'mobx';
import { RootStore } from 'store/RootStore';
import createNightModeUiState, {
  NightModeUiState,
} from 'component/NightMode/NightModeUiState';
import RemoteConfigStore from 'store/RemoteConfigStore';
import SeedableStorageInterface from 'middleware/SeedableStorageInterface';
export const NIGHT_MODE_USER_ENABLED_KEY = 'night_mode_user_enabled';

class NightModeController {
  nightModeUiState: NightModeUiState;
  remoteConfigStore: RemoteConfigStore;
  storage: SeedableStorageInterface;

  constructor(rootStore: RootStore) {
    this.nightModeUiState = createNightModeUiState(
      rootStore.hardwareStore,
      rootStore.remoteConfigStore,
    );

    this.remoteConfigStore = rootStore.remoteConfigStore;
    this.storage = rootStore.persistentStorage;

    makeAutoObservable(this, {
      nightModeUiState: false,
      remoteConfigStore: false,
    });

    reaction(
      () => 1 - this.nightModeUiState.appOpacity,
      (current, prev) => {
        [
          { min: -100, max: 0, logString: '0%' },
          { min: 0, max: 0.1, logString: '0-10%' },
          { min: 0.1, max: 0.2, logString: '10-20%' },
          { min: 0.2, max: 0.3, logString: '20-30%' },
          { min: 0.3, max: 0.4, logString: '30-40%' },
          { min: 0.4, max: 0.5, logString: '40-50%' },
          { min: 0.5, max: 0.6, logString: '50-60%' },
        ].forEach(({ min, max, logString }) => {
          if ((prev < min || prev > max) && current >= min && current <= max) {
            rootStore.ubiLogger.nightModeUbiLogger.logNightModeImpression(
              logString,
            );
          }
        });
      },
    );
  }

  get isNightMode() {
    return Boolean(
      JSON.parse(this.storage.getItem(NIGHT_MODE_USER_ENABLED_KEY) ?? 'false'),
    );
  }

  toggleNightMode(): void {
    this.storage.setItem(
      NIGHT_MODE_USER_ENABLED_KEY,
      JSON.stringify(!this.isNightMode),
    );
  }
}

export default NightModeController;

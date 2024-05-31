import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import { WIND_NOISE_ALERT_DISMISSED_KEY } from 'component/Npv/WindAlertBanner/WindAlertBannerUiState';
export const OTA_NONE_CRITICAL_OPTION = 'otaNoneCriticalOption';
export const FETCH_IMAGES = 'fetchImagesOption';

class DevOptionsStore {
  otaNoneCriticalOptionValue = false;

  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
    });

    this.rootStore = rootStore;
  }

  get alertDismissTime() {
    return this.rootStore.airVentInterferenceController.windAlertBannerUiState
      .dismissTime;
  }

  get windAlertThreshold() {
    return this.rootStore.windLevelStore.windAlertOnThreshold;
  }

  get alertDismissedAt(): string {
    const savedAt = this.rootStore.persistentStorage.getItem(
      WIND_NOISE_ALERT_DISMISSED_KEY,
    );

    if (savedAt) {
      const oldDate = new Date(parseInt(savedAt, 10));
      return `${oldDate}`;
    }
    return 'not dismissed';
  }

  get imageFetchEnabled() {
    return this.rootStore.imageStore.fetchEnabled;
  }

  get imageCacheSize() {
    return this.rootStore.imageStore.cacheSize;
  }

  get imagesLoaded() {
    return this.rootStore.imageStore.loaded;
  }

  // can not use get here as the value is set to observable false
  imagesInCache() {
    return this.rootStore.imageStore.images.size;
  }

  // can not use get here as the value is set to observable false
  handleCountWindThreshold(count: number) {
    const newValue = this.rootStore.windLevelStore.windAlertOnThreshold + count;
    if (newValue >= 1 && newValue <= 4) {
      this.rootStore.windLevelStore.setWindLevelAlertThreshold(newValue);
    }
  }

  setImageStoreCacheSize(size: number) {
    this.rootStore.imageStore.setCacheSize(
      this.rootStore.imageStore.cacheSize + size,
    );
  }

  setOtaNoneCriticalOption(checked: boolean) {
    this.otaNoneCriticalOptionValue = checked;
  }

  setImageFetchEnabled(checked: boolean) {
    this.rootStore.imageStore.setFetchEnabled(checked);
  }

  getNewTip = () => {
    this.rootStore.tipsStore.getNewTip();
    this.rootStore.overlayController.resetAndMaybeShowAModal();
  };

  clearLocalStorage = () => {
    this.rootStore.persistentStorage.clear();
  };
}

export default DevOptionsStore;

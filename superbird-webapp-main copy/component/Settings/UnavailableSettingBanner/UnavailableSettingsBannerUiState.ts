import { makeAutoObservable, runInAction } from 'mobx';

import SettingsUbiLogger from 'component/Settings/SettingsUbiLogger';

export const UNAVAILABLE_SETTINGS_BANNER_DISPLAY_DURATION_MS = 5_000;

export type UnavailableSettingsBannerUiState = ReturnType<
  typeof createUnavailableSettingsBannerUiState
>;

const createUnavailableSettingsBannerUiState = (
  settingsUbiLogger: SettingsUbiLogger,
) => {
  return makeAutoObservable({
    unavailableBannerVisible: false,
    bannerTimeoutId: 0,

    get shouldShowAlert(): boolean {
      return this.unavailableBannerVisible;
    },

    showUnavailableBanner() {
      this.setBannerState(true);
      window.clearTimeout(this.bannerTimeoutId);
      this.bannerTimeoutId = window.setTimeout(() => {
        runInAction(() => this.setBannerState(false));
      }, UNAVAILABLE_SETTINGS_BANNER_DISPLAY_DURATION_MS);
    },

    hideUnavailableBanner() {
      window.clearTimeout(this.bannerTimeoutId);
      this.setBannerState(false);
    },

    setBannerState(state: boolean): void {
      this.unavailableBannerVisible = state;
    },

    logImpression(): void {
      settingsUbiLogger.logUnavailableSettingBannerImpression();
    },
  });
};

export default createUnavailableSettingsBannerUiState;

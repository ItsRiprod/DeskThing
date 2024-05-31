import { makeAutoObservable, runInAction } from 'mobx';
import VoiceStore from 'store/VoiceStore';
import ContentShelfUbiLogger from 'eventhandler/ContentShelfUbiLogger';

export type VoiceMuteBannerUiState = ReturnType<
  typeof createVoiceMuteBannerUiState
>;

const createVoiceMuteBannerUiState = (
  voiceStore: VoiceStore,
  contentShelfUbiLogger: ContentShelfUbiLogger,
) => {
  return makeAutoObservable({
    bannerTriggered: false,
    timeoutId: 0,

    get shouldShowAlert(): boolean {
      return this.bannerTriggered && voiceStore.isMicMuted;
    },

    handleClickUnmute() {
      voiceStore.toggleMic();
      this.logUnmute();
    },

    triggerBanner() {
      this.setBannerState(true);
      window.clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => {
        runInAction(() => this.setBannerState(false));
      }, 20_000);
    },

    dismissVoiceBanner() {
      window.clearTimeout(this.timeoutId);
      this.setBannerState(false);
    },

    setBannerState(state: boolean): void {
      this.bannerTriggered = state;
    },

    logImpression(): void {
      contentShelfUbiLogger.logVoiceMutedBannerImpression();
    },

    logUnmute(): void {
      contentShelfUbiLogger.logMicUnMutedClicked();
    },
  });
};

export default createVoiceMuteBannerUiState;

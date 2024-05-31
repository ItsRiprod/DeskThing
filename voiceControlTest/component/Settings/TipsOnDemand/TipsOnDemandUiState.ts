import TipsStore, { Tip } from '../../../store/TipsStore';
import { makeAutoObservable } from 'mobx';
import SettingsStore from 'store/SettingsStore';
import Socket from 'Socket';
import { VoiceMessage } from 'types/messages';

export type TipsOnDemandUiState = ReturnType<typeof createTipsOnDemandUiState>;

const createTipsOnDemandUiState = (
  settingsStore: SettingsStore,
  tipsStore: TipsStore,
  socket: Socket,
) => {
  const ubiLogger = settingsStore.rootStore.ubiLogger.settingsUbiLogger;
  const uiState = makeAutoObservable({
    get tip(): Tip | undefined {
      return tipsStore.onDemandTip;
    },

    nextTip(prevTipDuration: number) {
      if (!this.tip) {
        return;
      }

      ubiLogger.logTipsOnDemandNextButtonClick();
      ubiLogger.logTipOnDemandImpression(this.tip.id, prevTipDuration);

      tipsStore.getOnDemandTip();
    },

    handleMount() {
      if (!tipsStore.onDemandTip || this.isError) {
        tipsStore.getOnDemandTip();
      }
    },

    handleUnmount(tipDuration: number, totalDuration: number) {
      if (this.isError || !this.tip) {
        return;
      }

      ubiLogger.logTipOnDemandImpression(this.tip.id, tipDuration);
      ubiLogger.logTipsOnDemandImpression(totalDuration);
    },

    handleConfirmError: () => {
      ubiLogger.logTipsOnDemandErrorConfirmation();
      settingsStore.handleBack();
    },

    handleDialPress() {
      if (!this.isError) {
        return;
      }

      ubiLogger.logTipsOnDemandErrorConfirmationDialPress();
      settingsStore.handleBack();
    },

    handleErrorViewMount: () => ubiLogger.logTipsOnDemandErrorImpression(),

    get isError(): boolean {
      return tipsStore.onDemandTipError;
    },

    handlePresetButtonPressed() {
      if (settingsStore.currentIsTipsOndemand && this.tip) {
        ubiLogger.logTipsOnDemandPresetsButtonClick(this.tip.id);
      }
    },

    handleWakeWord(): void {
      if (settingsStore.currentIsTipsOndemand && this.tip) {
        ubiLogger.logTipsOnDemandVoiceInteraction(this.tip.id);
      }
    },
  });

  socket.addSocketEventListener((msg: VoiceMessage) => {
    if (msg.type === 'voice_wakeword') {
      uiState.handleWakeWord();
    }
  });

  return uiState;
};

export default createTipsOnDemandUiState;

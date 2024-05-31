import UbiLogger from 'eventhandler/UbiLogger';
import OverlayUiState, {
  DEFAULT_PRESET_TIMEOUT,
  Overlay,
} from 'component/Overlays/OverlayUiState';
import { RootStore } from 'store/RootStore';
import { AppView } from 'store/ViewStore';
import { PRESET_SELECT_TO_PLAY_TIMEOUT } from 'component/Presets/PresetsUiState';

export type OverlayController = ReturnType<typeof createOverlayController>;

export const createOverlayController = (
  rootStore: RootStore,
  ubiLogger: UbiLogger,
) => {
  return {
    overlayUiState: new OverlayUiState(rootStore),

    get anyOverlayIsShowing(): boolean {
      return this.overlayUiState.isShowingAny();
    },

    isShowing(name: Overlay): boolean {
      return this.overlayUiState.isShowing(name);
    },

    showSettings(): void {
      this.overlayUiState.showSettings();
    },

    showPresets(timeout?: number): void {
      this.overlayUiState.showPresets(timeout ?? DEFAULT_PRESET_TIMEOUT);
    },

    showVoice(): void {
      this.overlayUiState.showOverlay('voice');
    },

    showPhoneCall(): void {
      this.overlayUiState.showOverlay('phone_call');
    },

    showPodcastSpeed(): void {
      this.overlayUiState.showOverlay('podcast_speed');
    },

    showFullScreenClock(): void {
      this.overlayUiState.showOverlay('full_screen_clock');
    },

    showStandby(): void {
      this.overlayUiState.showStandby();
    },

    resetAndMaybeShowAModal(): void {
      this.overlayUiState.resetAndMaybeShowAModal();
    },

    maybeShowAModal(): void {
      this.overlayUiState.maybeShowAModal();
    },

    maybeShowNotSupportedType(isStation: boolean): void {
      this.overlayUiState.maybeShowNotSupportedType(isStation);
    },

    handleBackButton(): void {
      switch (this.overlayUiState.currentOverlay) {
        case 'voice':
          ubiLogger.voiceUbiLogger.logBackDismissVoiceOverlay();
          rootStore.voiceStore.cancel();
          break;
        case 'presets':
          this.resetAndMaybeShowAModal();
          ubiLogger.presetsUbiLogger.logBackButtonClick();
          break;
        case 'settings':
          rootStore.settingsStore.handleBack();
          break;
        case 'podcast_speed':
          ubiLogger.podcastSpeedOptionsUbiLogger.logPodcastSpeedViewBackButton();
          this.resetAndMaybeShowAModal();
          break;
        case 'standby':
          ubiLogger.modalUbiLogger.logStandbyCancel();
          this.resetAndMaybeShowAModal();
          break;
        default:
          if (this.overlayUiState.isDismissible) {
            this.resetAndMaybeShowAModal();
          }
      }
    },

    handleDialPress(): void {
      switch (this.overlayUiState.currentOverlay) {
        case 'voice':
          if (
            rootStore.voiceStore.error ||
            rootStore.voiceStore.friendlyError
          ) {
            rootStore.voiceStore.retry();
          }
          break;
        case 'presets':
          rootStore.presetsController.presetsUiState.handleDialPress();
          window.setTimeout(
            () => this.overlayUiState.resetAndMaybeShowAModal(),
            PRESET_SELECT_TO_PLAY_TIMEOUT,
          );
          break;
        case 'settings':
          rootStore.settingsStore.handleDialPress();
          break;
        case 'podcast_speed':
          if (
            rootStore.npvStore.podcastSpeedUiState.selectedItem &&
            rootStore.playerStore.currentTrackUri
          ) {
            ubiLogger.podcastSpeedOptionsUbiLogger.logPodcastSpeedItemDialPressed(
              rootStore.playerStore.currentTrackUri,
              rootStore.npvStore.podcastSpeedUiState.selectedItem,
            );
            rootStore.npvStore.podcastSpeedUiState.handSpeedItemClicked(
              rootStore.npvStore.podcastSpeedUiState.selectedItem,
            );
          }
          break;
        case 'no_connection':
          this.showSettings();
          ubiLogger.modalUbiLogger.logGoToPhoneListDialPress();
          rootStore.settingsStore.showPhoneSettings();
          if (rootStore.viewStore.appView === AppView.ONBOARDING) {
            rootStore.onboardingStore.setOnboardingFinished();
          }
          break;
        case 'standby':
          if (this.overlayUiState.powerOffConfirmationIsActive) {
            rootStore.hardwareStore.powerOff();
            rootStore.ubiLogger.modalUbiLogger.logStandbyConfirm();
          } else {
            rootStore.settingsStore.handleBack();
            rootStore.ubiLogger.modalUbiLogger.logStandbyCancel();
          }
          break;
        default:
          break;
      }
    },

    handleDialLeft(): void {
      switch (this.overlayUiState.currentOverlay) {
        case 'standby':
          this.overlayUiState.setPowerOffConfirmationIsActive(true);
          this.showStandby();
          break;
        case 'promo':
          rootStore.npvStore.npvController.handleDialLeft();
          break;
        case 'settings':
          rootStore.settingsStore.handleDialLeft();
          break;
        case 'podcast_speed':
          if (rootStore.npvStore.podcastSpeedUiState.leftItem) {
            rootStore.npvStore.podcastSpeedUiState.updateSelectedItem(
              rootStore.npvStore.podcastSpeedUiState.leftItem,
            );
          }
          break;
        case 'presets':
          this.showPresets();
          rootStore.presetsController.presetsUiState.handleDialLeft();
          break;
        default:
          break;
      }
    },

    handleDialRight(): void {
      switch (this.overlayUiState.currentOverlay) {
        case 'standby':
          this.overlayUiState.setPowerOffConfirmationIsActive(false);
          this.overlayUiState.showStandby();
          break;
        case 'promo':
          rootStore.npvStore.npvController.handleDialRight();
          break;
        case 'settings':
          rootStore.settingsStore.handleDialRight();
          break;
        case 'podcast_speed':
          if (rootStore.npvStore.podcastSpeedUiState.rightItem) {
            rootStore.npvStore.podcastSpeedUiState.updateSelectedItem(
              rootStore.npvStore.podcastSpeedUiState.rightItem,
            );
          }
          break;
        case 'presets':
          this.showPresets();
          rootStore.presetsController.presetsUiState.handleDialRight();
          break;
        default:
          break;
      }
    },
  };
};

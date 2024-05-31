import HardwareEvents from 'helpers/HardwareEvents';
import { action } from 'mobx';
import { RootStore } from 'store/RootStore';
import { View } from 'store/ViewStore';

const reactToBackButton = (
  hardwareEvents: HardwareEvents,
  rootStore: RootStore,
) => {
  const {
    overlayController,
    viewStore,
    npvStore,
    tracklistStore,
    shelfStore,
    onboardingStore,
    ubiLogger,
    queueStore,
  } = rootStore;

  const handleBackButton = action(() => {
    if (onboardingStore.isOnboardingOngoing) {
      const disabledAtTimeOfPress = !onboardingStore.backEnabled;
      onboardingStore.handleBack();
      if (disabledAtTimeOfPress) {
        return;
      }
    }
    if (overlayController.anyOverlayIsShowing) {
      overlayController.handleBackButton();
    } else {
      switch (viewStore.currentView) {
        case View.CONTENT_SHELF:
          shelfStore.shelfController.handleBackButton();
          break;
        case View.TRACKLIST:
          tracklistStore.tracklistUiState.setShouldShowAddToQueueBanner(false);
          if (
            tracklistStore.tracklistUiState.browsingCurrentContext &&
            tracklistStore.tracklistUiState.currentTrackInTracklist &&
            !tracklistStore.tracklistUiState.currentlyPlayingItemSelected
          ) {
            tracklistStore.tracklistUiState.updateSelectedItem(
              tracklistStore.tracklistUiState.currentlyPlayingTrackOrFirst,
            );
          } else {
            ubiLogger.trackListUbiLogger.logBackButtonPressed(
              tracklistStore.tracklistUiState.contextUri,
            );
            viewStore.back();
          }
          break;
        case View.QUEUE:
          queueStore.queueUiState.handleBack();
          break;
        case View.NPV:
          npvStore.npvController.handleDialBack();
          break;
        default:
          break;
      }
      overlayController.maybeShowAModal();
    }
  });
  hardwareEvents.onBackButton(handleBackButton);
};

export default reactToBackButton;

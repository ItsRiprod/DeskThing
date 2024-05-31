import HardwareEvents from 'helpers/HardwareEvents';
import { RootStore } from 'store/RootStore';
import { AppView, View } from 'store/ViewStore';
import { action } from 'mobx';

export const isDialEnabled = (
  appView: AppView,
  isSettings: boolean,
  onboardingButtonEnabled: boolean,
  isPhoneCall: boolean,
) =>
  (appView === AppView.MAIN && !isPhoneCall) ||
  isSettings ||
  (appView === AppView.ONBOARDING && onboardingButtonEnabled);

const reactToDial = (hardwareEvents: HardwareEvents, rootStore: RootStore) => {
  const {
    overlayController,
    viewStore,
    npvStore,
    tracklistStore,
    shelfStore,
    settingsStore,
    hardwareStore,
    onboardingStore,
    ubiLogger,
    queueStore,
  } = rootStore;

  const handleDialPress = action(() => {
    if (onboardingStore.isOnboardingOngoing) {
      const disabledAtTimeOfPress = !onboardingStore.dialPressEnabled;
      onboardingStore.handleDialPress();
      if (disabledAtTimeOfPress) {
        return;
      }
    }
    if (overlayController.anyOverlayIsShowing) {
      overlayController.handleDialPress();
    } else {
      switch (viewStore.currentView) {
        case View.CONTENT_SHELF:
          shelfStore.shelfController.handleDialPress();
          break;
        case View.TRACKLIST:
          if (tracklistStore.tracklistUiState.selectedItem) {
            const id = ubiLogger.trackListUbiLogger.logDialPressTrackRow(
              tracklistStore.tracklistUiState.selectedItemIndex,
              tracklistStore.tracklistUiState.selectedItem.uri,
              tracklistStore.tracklistUiState.contextUri,
            );
            tracklistStore.tracklistUiState.handleItemSelected(
              tracklistStore.tracklistUiState.selectedItem,
              id,
            );
          }
          break;
        case View.QUEUE:
          queueStore.queueUiState.handleDialPress();
          break;
        case View.NPV:
          npvStore.npvController.handleDialPress();
          break;
        default:
          break;
      }
    }
  });

  const handleDialLongPress = action(() => {
    if (overlayController.isShowing('phone_call')) {
      return;
    }

    if (overlayController.isShowing('settings')) {
      settingsStore.handleDialLongPress();
    } else if (
      viewStore.isTracklist &&
      tracklistStore.tracklistUiState.selectedItem
    ) {
      tracklistStore.tracklistUiState.handleAddToQueue(
        tracklistStore.tracklistUiState.selectedItem,
      );
      tracklistStore.tracklistUiState.logTracklistItemLongPress();
    } else if (viewStore.currentView === View.NPV) {
      npvStore.npvController.handleDialLongPress();
    }
    overlayController.maybeShowAModal();
  });

  const handleDialDown = action(() => {
    if (
      !isDialEnabled(
        viewStore.appView,
        overlayController.isShowing('settings'),
        onboardingStore.dialPressEnabled,
        overlayController.isShowing('phone_call'),
      )
    ) {
      return;
    }
    npvStore.tipsUiState.dismissVisibleTip();
    hardwareStore.setDialPressed(true);
  });

  const handleDialUp = action(() => {
    if (
      !isDialEnabled(
        viewStore.appView,
        overlayController.isShowing('settings'),
        onboardingStore.dialPressEnabled,
        overlayController.isShowing('phone_call'),
      )
    ) {
      return;
    }
    hardwareStore.setDialPressed(false);
  });

  const handleDialLeft = action(() => {
    if (onboardingStore.isOnboardingOngoing) {
      const disabledAtTimeOfEvent = !onboardingStore.dialTurnEnabled;
      onboardingStore.handleDialTurn();
      if (disabledAtTimeOfEvent) {
        return;
      }
    }
    if (overlayController.anyOverlayIsShowing) {
      overlayController.handleDialLeft();
    } else {
      switch (viewStore.currentView) {
        case View.CONTENT_SHELF:
          shelfStore.shelfController.handleDialLeft();
          break;
        case View.TRACKLIST:
          viewStore.showTracklist();
          tracklistStore.tracklistUiState.setShouldShowAddToQueueBanner(false);
          if (tracklistStore.tracklistUiState.leftItem) {
            tracklistStore.tracklistUiState.updateSelectedItem(
              tracklistStore.tracklistUiState.leftItem,
            );
          }
          break;
        case View.QUEUE:
          queueStore.queueUiState.handleDialLeft();
          break;
        case View.NPV:
          npvStore.npvController.handleDialLeft();
          break;
        default:
          break;
      }
    }
  });

  const handleDialRight = action(() => {
    if (onboardingStore.isOnboardingOngoing) {
      onboardingStore.handleDialTurn();
      if (!onboardingStore.dialTurnEnabled) {
        return;
      }
    }
    if (overlayController.anyOverlayIsShowing) {
      overlayController.handleDialRight();
    } else {
      switch (viewStore.currentView) {
        case View.CONTENT_SHELF:
          shelfStore.shelfController.handleDialRight();
          break;
        case View.TRACKLIST:
          viewStore.showTracklist();
          tracklistStore.tracklistUiState.setShouldShowAddToQueueBanner(false);
          if (tracklistStore.tracklistUiState.rightItem) {
            tracklistStore.tracklistUiState.updateSelectedItem(
              tracklistStore.tracklistUiState.rightItem,
            );
          }
          break;
        case View.QUEUE:
          queueStore.queueUiState.handleDialRight();
          break;
        case View.NPV:
          npvStore.npvController.handleDialRight();
          break;
        default:
          break;
      }
    }
  });

  hardwareEvents.onDialPress(handleDialPress);
  hardwareEvents.onDialLongPress(handleDialLongPress);
  hardwareEvents.onDialButtonDown(handleDialDown);
  hardwareEvents.onDialButtonUp(handleDialUp);
  hardwareEvents.onDialLeft(handleDialLeft);
  hardwareEvents.onDialRight(handleDialRight);
};

export default reactToDial;

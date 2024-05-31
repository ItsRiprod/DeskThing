import HardwareEvents from 'helpers/HardwareEvents';
import { action } from 'mobx';
import { RootStore } from 'store/RootStore';
import { AppView } from 'store/ViewStore';

export const isSettingsButtonEnabled = ({
  appView,
  isPhoneCall,
  isShowingPromo,
}: {
  appView: AppView;
  isPhoneCall: boolean;
  isShowingPromo: boolean;
}) =>
  ![AppView.LOGO, AppView.ONBOARDING].includes(appView) &&
  !isPhoneCall &&
  !isShowingPromo;

const reactToSettingsButton = (
  hardwareEvents: HardwareEvents,
  rootStore: RootStore,
) => {
  const {
    overlayController,
    settingsStore,
    viewStore,
    npvStore,
    ubiLogger: { settingsUbiLogger },
  } = rootStore;

  const handleSettingsButton = action(() => {
    if (
      !isSettingsButtonEnabled({
        appView: viewStore.appView,
        isPhoneCall: overlayController.isShowing('phone_call'),
        isShowingPromo: overlayController.isShowing('promo'),
      })
    ) {
      return;
    }

    if (overlayController.isShowing('settings')) {
      settingsUbiLogger.logSettingsButtonHide();
      overlayController.resetAndMaybeShowAModal();
    } else {
      npvStore.tipsUiState.dismissVisibleTip();
      settingsUbiLogger.logSettingsButtonShow();
      settingsStore.reset();
      settingsStore.resetSubCategoryIndexes();
      overlayController.showSettings();
    }
  });
  const handleSettingsButtonLongPress = action(() => {
    settingsStore.handleSettingsButtonLongPress();
  });

  hardwareEvents.onSettingsLongPress(handleSettingsButtonLongPress);
  hardwareEvents.onSettings(handleSettingsButton);
};

export default reactToSettingsButton;

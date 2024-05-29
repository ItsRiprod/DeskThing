import { makeAutoObservable } from 'mobx';
import PhoneCallController from 'component/PhoneCall/PhoneCallController';
import HardwareStore from 'store/HardwareStore';
import SettingsStore, { View } from 'store/SettingsStore';
import { OverlayController } from 'component/Overlays/OverlayController';

export type PhoneCallsUiState = ReturnType<typeof createPhoneCallsUiState>;

export const NUMBER_OF_SCROLL_STEPS = 3;

const createPhoneCallsUiState = (
  settingsStore: SettingsStore,
  phoneCallsController: PhoneCallController,
  overlayController: OverlayController,
  hardwareStore: HardwareStore,
) => {
  return makeAutoObservable({
    scrollStep: 0,

    get highlightOption(): boolean {
      return this.scrollStep === 0 && hardwareStore.dialPressed;
    },

    get isNotificationStep(): boolean {
      return this.scrollStep === 0;
    },

    get phoneCallsSubmenuItem(): View {
      return settingsStore.phoneCallsView.rows![0];
    },

    setPhoneCallsScrollStep(newStep: number) {
      overlayController.showSettings();
      let actualStep = newStep;

      if (newStep > NUMBER_OF_SCROLL_STEPS - 0.4) {
        actualStep = NUMBER_OF_SCROLL_STEPS - 1;
      } else if (newStep < 0.4) {
        actualStep = 0;
      }

      this.scrollStep = actualStep;
    },

    handleDialPress() {
      if (this.isNotificationStep) {
        phoneCallsController.toggleIsUserEnabled();
      }
    },

    handleDialRight() {
      this.setPhoneCallsScrollStep(this.scrollStep + 1);
    },

    handleDialLeft() {
      this.setPhoneCallsScrollStep(this.scrollStep - 1);
    },

    resetScrollStep() {
      this.scrollStep = 0;
    },
  });
};

export default createPhoneCallsUiState;

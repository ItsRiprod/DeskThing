import { makeAutoObservable } from 'mobx';
import { RootStore } from 'store/RootStore';
import PresetsUiState from 'component/Presets/PresetsUiState';
import InterappActions from 'middleware/InterappActions';
import { AppView } from 'store/ViewStore';

export const isPresetButtonsEnabled = (rootStore: RootStore): boolean => {
  const {
    viewStore,
    permissionsStore,
    remoteControlStore,
    sessionStateStore,
    overlayController,
  } = rootStore;

  return (
    viewStore.appView === AppView.MAIN &&
    sessionStateStore.isLoggedIn &&
    remoteControlStore.interappConnected &&
    permissionsStore.canUseCarThing === true &&
    !overlayController.isShowing('phone_call') &&
    !overlayController.isShowing('promo')
  );
};

class PresetsController {
  rootStore: RootStore;
  interappActions: InterappActions;
  presetsUiState: PresetsUiState;

  constructor(rootStore: RootStore, interappActions: InterappActions) {
    this.rootStore = rootStore;
    this.interappActions = interappActions;
    this.presetsUiState = new PresetsUiState(
      rootStore.presetsDataStore,
      rootStore.ubiLogger.presetsUbiLogger,
      rootStore.overlayController,
      rootStore.playerStore,
      rootStore.shelfStore,
      rootStore.queueStore,
      rootStore.viewStore,
      rootStore.npvStore,
      rootStore.interappActions,
    );

    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      presetsUiState: false,
    });
  }

  reset() {
    this.presetsUiState.reset();
  }

  get isPresetButtonsEnabled() {
    return isPresetButtonsEnabled(this.rootStore);
  }

  get isSwipeDownPresetsEnabled() {
    return (
      this.isPresetButtonsEnabled &&
      !this.rootStore.overlayController.isShowing('voice')
    );
  }
}

export default PresetsController;

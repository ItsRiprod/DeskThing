import PresetsController from 'component/Presets/PresetsController';
import PresetsUbiLogger from 'eventhandler/PresetsUbiLogger';
import { OverlayController } from 'component/Overlays/OverlayController';

class SwipeDownHandleUiState {
  overlayController: OverlayController;
  presetsStore: PresetsController;
  presetsUbiLogger: PresetsUbiLogger;

  constructor(
    overlayController: OverlayController,
    presetsStore: PresetsController,
    presetsUbiLogger: PresetsUbiLogger,
  ) {
    this.overlayController = overlayController;
    this.presetsStore = presetsStore;
    this.presetsUbiLogger = presetsUbiLogger;
  }

  onSwipeDown = () => {
    if (this.presetsStore.isSwipeDownPresetsEnabled) {
      this.presetsUbiLogger.logSwipeDown();
      this.overlayController.showPresets();
      this.presetsStore.presetsUiState.highlightPreset();
    }
  };
}

export default SwipeDownHandleUiState;

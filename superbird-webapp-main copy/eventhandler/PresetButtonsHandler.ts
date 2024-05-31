import HardwareEvents from 'helpers/HardwareEvents';
import { PresetNumber } from 'store/PresetsDataStore';
import { RootStore } from 'store/RootStore';

const reactToPresetButtons = (
  hardwareEvents: HardwareEvents,
  { presetsController, settingsStore }: RootStore,
) => {
  const handlePresetButtonPress = (presetNumber: PresetNumber) => {
    if (!presetsController.isPresetButtonsEnabled) {
      return;
    }

    settingsStore.handlePresetButtonPressed();

    presetsController.presetsUiState.handlePresetButtonPress(presetNumber);
  };

  const handlePresetButtonLongPress = (presetNumber: PresetNumber) => {
    if (!presetsController.isPresetButtonsEnabled) {
      return;
    }

    presetsController.presetsUiState.handlePresetButtonLongPress(presetNumber);
  };

  hardwareEvents.onPreset1(handlePresetButtonPress);
  hardwareEvents.onPreset2(handlePresetButtonPress);
  hardwareEvents.onPreset3(handlePresetButtonPress);
  hardwareEvents.onPreset4(handlePresetButtonPress);
  hardwareEvents.onPreset1LongPress(handlePresetButtonLongPress);
  hardwareEvents.onPreset2LongPress(handlePresetButtonLongPress);
  hardwareEvents.onPreset3LongPress(handlePresetButtonLongPress);
  hardwareEvents.onPreset4LongPress(handlePresetButtonLongPress);
};

export default reactToPresetButtons;

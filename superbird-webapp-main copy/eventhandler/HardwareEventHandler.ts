import HardwareEvents from 'helpers/HardwareEvents';
import { RootStore } from 'store/RootStore';
import reactToBackButton from './BackButtonHandler';
import reactToDial from './DialHandler';
import reactToPresetButtons from './PresetButtonsHandler';
import reactToSettingsButton from './SettingsButtonHandler';

export default {
    handleEvents: (hardwareEvents: HardwareEvents, rootStore: RootStore) => {
        reactToBackButton(hardwareEvents, rootStore);
        reactToDial(hardwareEvents, rootStore);
        reactToPresetButtons(hardwareEvents, rootStore);
        reactToSettingsButton(hardwareEvents, rootStore);
    },
};

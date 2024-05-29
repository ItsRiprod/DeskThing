import HardwareEvents, { EventCode, HardwareEvent } from './HardwareEvents';
import { PresetNumber } from 'store/PresetsDataStore';

class MockHardwareEvents {
  hardwareEvents: HardwareEvents;

  constructor(hardwareEvents: HardwareEvents) {
    this.hardwareEvents = hardwareEvents;
  }

  doTimes(action: () => void, n: number) {
    for (let i = 0; i < n; i++) {
      action();
    }
  }

  startListening(): void {
    document.addEventListener('keydown', this.fakeKeyEventHandler);
  }

  triggerDialRight = (times = 1): void => {
    this.doTimes(
      () => this.hardwareEvents.notifyListeners(HardwareEvent.DIAL_RIGHT),
      times,
    );
  };

  triggerDialLeft(times = 1): void {
    this.doTimes(
      () => this.hardwareEvents.notifyListeners(HardwareEvent.DIAL_LEFT),
      times,
    );
  }

  triggerDialPress(times = 1): void {
    this.doTimes(
      () => this.hardwareEvents.notifyListeners(HardwareEvent.DIAL_PRESS),
      times,
    );
  }

  triggerDialButtonDown(): void {
    this.hardwareEvents.notifyListeners(HardwareEvent.DIAL_BUTTON_DOWN);
  }

  triggerDialButtonUp(): void {
    this.hardwareEvents.notifyListeners(HardwareEvent.DIAL_BUTTON_UP);
  }

  triggerDialLongPress(): void {
    this.hardwareEvents.notifyListeners(HardwareEvent.DIAL_LONG_PRESS);
  }

  triggerBack(times = 1): void {
    this.doTimes(
      () => this.hardwareEvents.notifyListeners(HardwareEvent.BACK),
      times,
    );
  }

  triggerPreset(presetNumber: PresetNumber): void {
    switch (presetNumber) {
      case 1:
        this.hardwareEvents.notifyListeners(HardwareEvent.PRESET_1);
        break;
      case 2:
        this.hardwareEvents.notifyListeners(HardwareEvent.PRESET_2);
        break;
      case 3:
        this.hardwareEvents.notifyListeners(HardwareEvent.PRESET_3);
        break;
      case 4:
        this.hardwareEvents.notifyListeners(HardwareEvent.PRESET_4);
        break;
      default:
        throw new Error(`no preset ${presetNumber}`);
    }
  }

  triggerPreset4LongPress(): void {
    this.hardwareEvents.notifyListeners(HardwareEvent.PRESET_4_LONG_PRESS);
  }

  triggerSettings(): void {
    this.hardwareEvents.notifyListeners(HardwareEvent.SETTINGS);
  }

  triggerSettingsLongPress(): void {
    this.hardwareEvents.notifyListeners(HardwareEvent.SETTINGS_LONG_PRESS);
  }

  private fakeKeyEventHandler = (e: KeyboardEvent): void => {
    switch (e.code) {
      case EventCode.ARROW_UP:
        e.preventDefault();
        this.triggerDialLeft();
        break;
      case EventCode.ARROW_DOWN:
        e.preventDefault();
        this.triggerDialRight();
        break;
      case EventCode.ARROW_LEFT:
        e.preventDefault();
        this.triggerDialLeft();
        break;
      case EventCode.ARROW_RIGHT:
        e.preventDefault();
        this.triggerDialRight();
        break;
      default:
        break;
    }
  };
}

export default MockHardwareEvents;

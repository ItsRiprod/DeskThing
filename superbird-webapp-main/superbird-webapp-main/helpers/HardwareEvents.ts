import LongPressHandler from './LongPressHandler';
import { PresetNumber } from 'store/PresetsDataStore';

export enum HardwareEvent {
  BACK = 'back',
  DIAL_LEFT = 'dial_left',
  DIAL_PRESS = 'dial_press',
  DIAL_LONG_PRESS = 'dial_long_press',
  DIAL_BUTTON_DOWN = 'dial_button_down',
  DIAL_BUTTON_UP = 'dial_button_up',
  DIAL_RIGHT = 'dial_right',
  SETTINGS = 'settings',
  PRESET_1 = 'preset_1',
  PRESET_2 = 'preset_2',
  PRESET_3 = 'preset_3',
  PRESET_4 = 'preset_4',
  PRESET_1_LONG_PRESS = 'preset_1_long_press',
  PRESET_2_LONG_PRESS = 'preset_2_long_press',
  PRESET_3_LONG_PRESS = 'preset_3_long_press',
  PRESET_4_LONG_PRESS = 'preset_4_long_press',
  SETTINGS_LONG_PRESS = 'settings_long_press',
}

export enum EventCode {
  ENTER = 'Enter',
  ESCAPE = 'Escape',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_UP = 'ArrowUp',
  ARROW_RIGHT = 'ArrowRight',
  ARROW_DOWN = 'ArrowDown',
  DIGIT_1 = 'Digit1',
  DIGIT_2 = 'Digit2',
  DIGIT_3 = 'Digit3',
  DIGIT_4 = 'Digit4',
  KEY_M = 'KeyM',
}

type Listener = {
  event: HardwareEvent;
  callback: () => void;
};

class HardwareEvents {
  listeners: Map<HardwareEvent, Listener>;
  keysDown: Set<EventCode>;
  longPressHandler: LongPressHandler;

  constructor() {
    this.listeners = new Map<HardwareEvent, Listener>();
    this.keysDown = new Set<EventCode>();
    this.longPressHandler = new LongPressHandler();
    document.addEventListener('wheel', this.wheelEventHandler);
    document.addEventListener('keydown', this.keyDownEventHandler);
    document.addEventListener('keyup', this.keyUpEventHandler);
  }

  private addListener(event: HardwareEvent, callback: () => void) {
    this.listeners.set(event, {
      event,
      callback,
    });
  }

  onDialLeft(callback: () => void) {
    this.addListener(HardwareEvent.DIAL_LEFT, callback);
  }

  onDialRight(callback: () => void) {
    this.addListener(HardwareEvent.DIAL_RIGHT, callback);
  }

  onDialPress(callback: () => void) {
    this.addListener(HardwareEvent.DIAL_PRESS, callback);
  }

  onDialLongPress(callback: () => void) {
    this.addListener(HardwareEvent.DIAL_LONG_PRESS, callback);
  }

  onDialButtonDown(callback: () => void) {
    this.addListener(HardwareEvent.DIAL_BUTTON_DOWN, callback);
  }

  onDialButtonUp(callback: () => void) {
    this.addListener(HardwareEvent.DIAL_BUTTON_UP, callback);
  }

  onBackButton(callback: () => void) {
    this.addListener(HardwareEvent.BACK, callback);
  }

  onPreset1(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_1, () => callback(1));
  }

  onPreset2(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_2, () => callback(2));
  }

  onPreset3(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_3, () => callback(3));
  }

  onPreset4(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_4, () => callback(4));
  }

  onPreset1LongPress(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_1_LONG_PRESS, () => callback(1));
  }

  onPreset2LongPress(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_2_LONG_PRESS, () => callback(2));
  }

  onPreset3LongPress(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_3_LONG_PRESS, () => callback(3));
  }

  onPreset4LongPress(callback: (n: PresetNumber) => void) {
    this.addListener(HardwareEvent.PRESET_4_LONG_PRESS, () => callback(4));
  }

  onSettings(callback: () => void) {
    this.addListener(HardwareEvent.SETTINGS, callback);
  }

  onSettingsLongPress(callback: () => void) {
    this.addListener(HardwareEvent.SETTINGS_LONG_PRESS, callback);
  }

  notifyListeners(event: HardwareEvent): void {
    this.listeners.forEach((listener) => {
      if (listener.event === event) {
        listener.callback();
      }
    });
  }
  private wheelEventHandler = (event: WheelEvent) => {
    if (event.deltaX < 0) {
      this.notifyListeners(HardwareEvent.DIAL_LEFT);
    } else if (event.deltaX > 0) {
      this.notifyListeners(HardwareEvent.DIAL_RIGHT);
    }
  };

  private handleKeyDown = (event: EventCode, listener: HardwareEvent) => {
    if (!this.keysDown.has(event)) {
      this.keysDown.add(event);
      this.longPressHandler.startLongPressTimer(event, () => {
        this.notifyListeners(listener);
      });
    }
  };

  private keyDownEventHandler = (event: KeyboardEvent) => {
    switch (event.code) {
      case EventCode.ENTER:
        if (!this.keysDown.has(event.code)) {
          this.keysDown.add(event.code);
          this.notifyListeners(HardwareEvent.DIAL_BUTTON_DOWN);
          this.longPressHandler.startLongPressTimer(event.code, () =>
            this.notifyListeners(HardwareEvent.DIAL_LONG_PRESS),
          );
        }
        break;
      case EventCode.DIGIT_1:
        this.handleKeyDown(event.code, HardwareEvent.PRESET_1_LONG_PRESS);
        break;
      case EventCode.DIGIT_2:
        this.handleKeyDown(event.code, HardwareEvent.PRESET_2_LONG_PRESS);
        break;
      case EventCode.DIGIT_3:
        this.handleKeyDown(event.code, HardwareEvent.PRESET_3_LONG_PRESS);
        break;
      case EventCode.DIGIT_4:
        this.handleKeyDown(event.code, HardwareEvent.PRESET_4_LONG_PRESS);
        break;
      case EventCode.ESCAPE:
        this.notifyListeners(HardwareEvent.BACK);
        break;
      case EventCode.KEY_M: // (legacy. used to be 'mute')
        this.handleKeyDown(event.code, HardwareEvent.SETTINGS_LONG_PRESS);
        break;
      default:
        break;
    }
  };

  private keyUpEventHandler = (event: KeyboardEvent) => {
    switch (event.code) {
      case EventCode.ENTER:
        this.keysDown.delete(event.code);
        this.notifyListeners(HardwareEvent.DIAL_BUTTON_UP);
        this.longPressHandler.fireShortPressAndAbortLongPress(
          event.code,
          () => {
            this.notifyListeners(HardwareEvent.DIAL_PRESS);
          },
        );
        break;
      case EventCode.DIGIT_1:
        this.keysDown.delete(event.code);
        this.longPressHandler.fireShortPressAndAbortLongPress(
          event.code,
          () => {
            this.notifyListeners(HardwareEvent.PRESET_1);
          },
        );
        break;
      case EventCode.DIGIT_2:
        this.keysDown.delete(event.code);
        this.longPressHandler.fireShortPressAndAbortLongPress(
          event.code,
          () => {
            this.notifyListeners(HardwareEvent.PRESET_2);
          },
        );
        break;
      case EventCode.DIGIT_3:
        this.keysDown.delete(event.code);
        this.longPressHandler.fireShortPressAndAbortLongPress(
          event.code,
          () => {
            this.notifyListeners(HardwareEvent.PRESET_3);
          },
        );
        break;
      case EventCode.DIGIT_4:
        this.keysDown.delete(event.code);
        this.longPressHandler.fireShortPressAndAbortLongPress(
          event.code,
          () => {
            this.notifyListeners(HardwareEvent.PRESET_4);
          },
        );
        break;
      case EventCode.KEY_M: // (legacy. used to be 'mute')
        this.keysDown.delete(event.code);
        this.longPressHandler.fireShortPressAndAbortLongPress(
          event.code,
          () => {
            this.notifyListeners(HardwareEvent.SETTINGS);
          },
        );
        break;
      default:
        break;
    }
  };
}

export default HardwareEvents;

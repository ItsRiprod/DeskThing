import { EventCode } from 'helpers/HardwareEvents';

type KeyTimeout = {
  key: string;
  timeoutId: number;
};

class LongPressHandler {
  activeTimeouts: Array<KeyTimeout>;
  DEFAULT_LONG_PRESS_TIMEOUT = 1000;

  constructor() {
    this.activeTimeouts = [];
  }

  startLongPressTimer(pressedKey: EventCode, longPressCallback: () => void) {
    const keyTimeoutId = window.setTimeout(() => {
      this.activeTimeouts = this.activeTimeouts.filter(
        (keyTimeout) => keyTimeout.timeoutId !== keyTimeoutId,
      );
      longPressCallback();
    }, this.DEFAULT_LONG_PRESS_TIMEOUT);
    this.activeTimeouts.push({
      key: pressedKey,
      timeoutId: keyTimeoutId,
    });
  }

  fireShortPressAndAbortLongPress(
    pressedKey: EventCode,
    shortPressCallback: () => void,
  ) {
    if (
      this.activeTimeouts.some(
        (activeTimeout) => activeTimeout.key === pressedKey,
      )
    ) {
      this.activeTimeouts.forEach((activeTimeout) =>
        window.clearTimeout(activeTimeout.timeoutId),
      );
      this.activeTimeouts = this.activeTimeouts.filter(
        (activeTimeout) => activeTimeout.key !== pressedKey,
      );
      shortPressCallback();
    }
  }
}

export default LongPressHandler;

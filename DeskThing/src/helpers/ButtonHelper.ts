// Remaps the Carthing buttons to events that can be used elsewhere in the code

export enum Button {
  BUTTON_1,
  BUTTON_2,
  BUTTON_3,
  BUTTON_4,
  BUTTON_5,
  SCROLL_LEFT,
  SCROLL_RIGHT,
  SCROLL_PRESS,
  FRONT_BUTTON,
  SWIPE,
  OTHER,
}

export enum EventFlavour {
  Down,
  Up,
  Long,
  Short,
  LongPress,
  LeftSwipe,
  RightSwipe,
  UpSwipe,
  DownSwipe,
}

function mapButton(event: string): Button {
  switch (event) {
    case 'Digit1':
      return Button.BUTTON_1;
    case 'Digit2':
      return Button.BUTTON_2;
    case 'Digit3':
      return Button.BUTTON_3;
    case 'Digit4':
      return Button.BUTTON_4;
    case 'KeyM':
      return Button.BUTTON_5;
    case 'Enter':
      return Button.SCROLL_PRESS;
    case 'Escape':
      return Button.FRONT_BUTTON;
    default:
      //throw new Error("I don't know this button " + event);
      return Button.OTHER;
  }
}

function listenerKey(btn: Button, flv: EventFlavour): string {
  return `${btn}_${flv}`;
}

class ButtonHelper {
  private static instance: ButtonHelper = new ButtonHelper();


  listeners: Map<string, ((btn: Button, flv: EventFlavour) => void)[]>;
  buttonStates: { [key: string]: EventFlavour };
  callback: ((btn: Button, flv: EventFlavour) => void) | null = null;

  longPressTimeouts: Map<Button, number>;

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  constructor() {
    this.listeners = new Map();
    this.buttonStates = {};
    this.longPressTimeouts = new Map();

    document.addEventListener('wheel', this.wheelEventHandler);
    document.addEventListener('keydown', this.keyDownEventHandler);
    document.addEventListener('keyup', this.keyUpEventHandler);
    document.addEventListener('touchstart', this.touchStartHandler);
    document.addEventListener('touchmove', this.touchMoveHandler);
    document.addEventListener('touchend', this.touchEndHandler);
  }

  static getInstance(): ButtonHelper {
    if (!ButtonHelper.instance) {
      ButtonHelper.instance = new ButtonHelper();
    }
    return ButtonHelper.instance;
  }

  getButtonStates(): { [key: string]: EventFlavour } {
    return { ...this.buttonStates };
  }

  addListener(btn: Button, flv: EventFlavour, fn: (btn: Button, flv: EventFlavour) => void): void {
    const currentListeners = this.listeners.get(listenerKey(btn, flv)) || [];
    this.listeners.set(listenerKey(btn, flv), [...currentListeners, fn]);
  }
  removeListener(btn: Button, flv: EventFlavour): void {
    this.listeners.delete(listenerKey(btn, flv));
  }

  setCallback(callback: (btn: Button, flv: EventFlavour) => void): void {
    this.callback = callback;
  }

  private wheelEventHandler = (event: WheelEvent) => {
    if (event.deltaX < 0) {
      this.notify(Button.SCROLL_LEFT, EventFlavour.Short);
    } else if (event.deltaX > 0) {
      this.notify(Button.SCROLL_RIGHT, EventFlavour.Short);
    }
  };

  private notify(btn: Button, flv: EventFlavour) {
    const currentListeners = this.listeners.get(listenerKey(btn, flv)) || [];
    for (const listener of currentListeners) {
      listener(btn, flv);
    }
    if (this.callback) {
      this.callback(btn, flv);
    }
  }

  private keyDownEventHandler = (event: KeyboardEvent) => {
    const button = mapButton(event.code);
    this.buttonStates[button] = EventFlavour.Down;
    this.notify(button, EventFlavour.Down);

    if (!this.longPressTimeouts.has(button)) {
      const timeout = setTimeout(() => {
        this.buttonStates[button] = EventFlavour.LongPress;
        this.notify(button, EventFlavour.LongPress);
      }, 1000); // Adjust the timeout duration as needed
      this.longPressTimeouts.set(button, timeout);
    }
  };

  private keyUpEventHandler = (event: KeyboardEvent) => {
    const button = mapButton(event.code);
    this.buttonStates[button] = EventFlavour.Up;
    this.notify(button, EventFlavour.Up);

    if (this.longPressTimeouts.has(button)) {
      clearTimeout(this.longPressTimeouts.get(button)!);
      this.longPressTimeouts.delete(button);
    }
  };


  private touchStartHandler = (event: TouchEvent) => {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchEndX = event.touches[0].clientX;
    this.touchEndY = event.touches[0].clientY;
  };

  private touchMoveHandler = (event: TouchEvent) => {
    this.touchEndX = event.touches[0].clientX;
    this.touchEndY = event.touches[0].clientY;
  };

  private touchEndHandler = () => {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;

    if (Math.abs(deltaX) > 400 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this.notify(Button.SWIPE, EventFlavour.LeftSwipe);
      } else {
        this.notify(Button.SWIPE, EventFlavour.RightSwipe);
      }
    } else if (Math.abs(deltaY) > 200) {
      if (deltaY > 0) {
        this.notify(Button.SWIPE, EventFlavour.DownSwipe);
      } else {
        this.notify(Button.SWIPE, EventFlavour.UpSwipe);
      }
    }
  };
  destroy() {
    // Clean up event listeners
    document.removeEventListener('wheel', this.wheelEventHandler);
    document.removeEventListener('keydown', this.keyDownEventHandler);
    document.removeEventListener('keyup', this.keyUpEventHandler);
    document.removeEventListener('touchstart', this.touchStartHandler);
    document.removeEventListener('touchmove', this.touchMoveHandler);
    document.removeEventListener('touchend', this.touchEndHandler);

    // Clear any remaining long press timeouts
    this.longPressTimeouts.forEach(timeout => clearTimeout(timeout));

    ButtonHelper.instance = null;
  }
}

export default ButtonHelper;

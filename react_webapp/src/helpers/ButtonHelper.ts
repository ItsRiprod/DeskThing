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
}

export enum EventFlavour {
  Down,
  Up,
  Long,
  Short,
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
      throw new Error("I don't know this button " + event);
  }
}

function listenerKey(btn: Button, flv: EventFlavour): string {
  return `${btn}_${flv}`;
}

export default class ButtonHelper {
  listeners: Map<string, ((btn: Button, flv: EventFlavour) => void)[]>;
  constructor() {
    this.listeners = new Map();
    document.addEventListener('wheel', this.wheelEventHandler);
    document.addEventListener('keydown', this.keyDownEventHandler);
    document.addEventListener('keyup', this.keyUpEventHandler);
  }

  addListener(btn: Button, flv: EventFlavour, fn: (btn: Button, flv: EventFlavour) => void): void {
    const currentListeners = this.listeners.get(listenerKey(btn, flv)) || [];
    this.listeners.set(listenerKey(btn, flv), [...currentListeners, fn]);
  }
  removeListener(btn: Button, flv: EventFlavour): void {
    this.listeners.delete(listenerKey(btn, flv));
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
  }

  private keyDownEventHandler = (event: KeyboardEvent) => {
    this.notify(mapButton(event.code), EventFlavour.Down);
  };

  private keyUpEventHandler = (event: KeyboardEvent) => {
    this.notify(mapButton(event.code), EventFlavour.Up);
  };
}

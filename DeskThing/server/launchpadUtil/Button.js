/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
class Button {
  constructor(id, color, type, action) {
    this.id = id;
    this.color = color; // value from 1 to 127
    this.type = type; // 144 = solid, 145 = blinking, 146 = fading
    this.action = action; // Function to execute when button is pressed
  }

  setColor(color) {
    this.color = color;
  }

  setType(type) {
    this.type = type;
  }

  setAction(action) {
    this.action = action;
  }

  runAction(value = null) {
    if (this.action) {
      this.action(value);
    }
  }
}

export default Button;

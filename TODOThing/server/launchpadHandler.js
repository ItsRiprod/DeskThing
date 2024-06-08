/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const midi = require('midi');

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

    runAction() {
        if (this.action) {
            this.action();
        }
    }
}


// Set up a new input.
const input = new midi.Input();
const input2 = new midi.Input();
const output2 = new midi.Output();
output2.openPort(2);
input.openPort(0);
input2.openPort(1);
let color = 0;
let type = 0;
const grid = [];
for (let row = 0; row < 9; row++) {
    const gridRow = [];
    for (let col = 0; col < 9; col++) {
        const buttonId = row * 10 + col + 11; // Assuming IDs start at 11 and go sequentially
        gridRow.push(new Button(buttonId, { r: 0, g: 0, b: 0 }, 144, null));
    }
    grid.push(gridRow);
}

// Configure a callback.
input.on('message', (deltaTime, message) => {
    // The message is an array of numbers corresponding to the MIDI bytes:
    //   [status, data1, data2]
    const [status, data1, data2] = message;
  
    // Check the status byte to determine the type of message
    switch (status) {
      case 0x90: // Note On
        console.log(`${status} Note On: ${data1}, Velocity: ${data2}`);
        // Send a Note On message to the output
        color = data2;
        output2.sendMessage([status, data1, data2]);
        break;
      case 0x80: // Note Off
        console.log(`${status} Note Off: ${data1}, Velocity: ${data2}`);
        // Send a Note Off message to the output
        output2.sendMessage([status, data1, data2]);
        break;
      case 0xB0: // Control Change
        if (data2 < 10) {
            type = 128;
        } else if (data2 < 64) {
            type = 144;
        } else if (data2 < 110) {
            type = 145;
        } else if (data2 < 128) {
            type = 146;
        }
        console.log(`${status} Data: ${type}, Control Change: ${data1}, Value: ${data2}`);
        // Send a Control Change message to the output
        output2.sendMessage([status, data1, data2]);




        break;
      case 0xE0: // Pitch Control
        console.log(`${status} Pitch: ${data1}, Value: ${data2}`);
        // Send a Control Change message to the output
        output2.sendMessage([status, data1, data2]);
        break;
      // Add more cases for other MIDI message types as needed
      default:
        console.log(`${status} Unhandled MIDI message: ${message}`);
    }
  });
input2.on('message', (deltaTime, message) => {
    
  const [status, data1, data2] = message;
  if (status === 0x90 /*|| status === 0x80*/) {

    // Update the LED state in the ledStates object

    output2.sendMessage([type, data1, color]);
    console.log(`${status} Type: ${type}, Number: ${data1} Color: ${color}`);

  }

});

// Open the first available input port.

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false);




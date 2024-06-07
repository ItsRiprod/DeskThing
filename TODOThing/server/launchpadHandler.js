/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const midi = require('midi');
// Set up a new input.
const input = new midi.Input();
const input2 = new midi.Input();
const output2 = new midi.Output();
output2.openPort(2);
input.openPort(0);
input2.openPort(1);

// Configure a callback.
input.on('message', (deltaTime, message) => {
    // The message is an array of numbers corresponding to the MIDI bytes:
    //   [status, data1, data2]
    const [status, data1, data2] = message;
  
    // Check the status byte to determine the type of message
    switch (status) {
      case 0x90: // Note On
        console.log(`Note On: ${data1}, Velocity: ${data2}`);
        // Send a Note On message to the output
        output2.sendMessage([status, data1, data2]);
        break;
      case 0x80: // Note Off
        console.log(`Note Off: ${data1}, Velocity: ${data2}`);
        // Send a Note Off message to the output
        output2.sendMessage([status, data1, data2]);
        break;
      case 0xB0: // Control Change
        console.log(`Control Change: ${data1}, Value: ${data2}`);
        // Send a Control Change message to the output
        output2.sendMessage([status, data1, data2]);
        break;
      // Add more cases for other MIDI message types as needed
      default:
        console.log(`Unhandled MIDI message: ${message}`);
    }
  });
input2.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  console.log(`m: ${message} d: ${deltaTime}`);
  const row = 2; // Rows are 0-7 from top to bottom
  const column = 3; // Columns are 0-7 from left to right
  const noteNumber = row * 16 + column; // Calculate the note number
  const velocity = 127; // Maximum velocity (fully on)
  
  output2.sendMessage([0xFA, noteNumber, 0]);
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

// ... receive MIDI messages ...

// Close the port when done.


/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const midi = require('midi');
const dashboard = require('./launchpadApps/dashboard');
const colors = require('./launchpadApps/colors');
const Button = require('./launchpadUtil/Button');

const launchpadI = new midi.Input();
const launchpadO = new midi.Output();
launchpadI.openPort(1);
launchpadO.openPort(2);

/**
 * Getters and setters
 */
function getInput() {
  return launchpadI;
}
function getOutput() {
  return launchpadO;
}
const views = {
  dashboard,
  colors,
};

let currentView = 'dashboard';
let grid = views[currentView].getGrid();
let updateInterval;

function startUpdateInterval() {
    stopUpdateInterval(); // Stop any existing interval
    updateInterval = setInterval(() => {
        updateCurrentView();
    }, 1000); // Update every second, adjust as needed
}

function stopUpdateInterval() {
    clearInterval(updateInterval);
}

function updateCurrentView() {
    const updatedGrid = views[currentView].updateGrid(grid); // Each view should implement an updateGrid function
    updateGrid(updatedGrid);
}

/**
 * Set the color of a specific button on the Launchpad
 * @param {number} row - Row index of the button
 * @param {number} col - Column index of the button
 * @param {number} color - Color value from 1 to 127
 */
function setButtonColor(row, col, color) {
  const button = grid[row][col];
  button.setColor(color);
  launchpadO.sendMessage([button.type, button.id, color]);
}
/**
 * Set the type of a specific button on the Launchpad
 * @param {number} row - Row index of the button
 * @param {number} col - Column index of the button
 * @param {number} type - Type value (144 = solid, 145 = blinking, 146 = fading)
 */
function setButtonType(row, col, type) {
  const button = grid[row][col];
  button.setType(type);
  launchpadO.sendMessage([type, button.id, button.color]);
}
/**
 * Reset all buttons on the Launchpad to the default state
 */
function resetGrid() {
  grid.forEach(row => {
      row.forEach(button => {
          button.setColor(0);
          button.setType(144);
          launchpadO.sendMessage([144, button.id, 0]);
      });
  });
}
/**
 * Update the Launchpad grid with a new 2D array of button configurations
 * @param {Button[][]} buttonGrid - 2D array of Button objects
 */
function updateGrid(buttonGrid) {
  buttonGrid.forEach((row, rowIndex) => {
      row.forEach((button, colIndex) => {
          const currentButton = grid[rowIndex][colIndex];
          currentButton.setColor(button.color);
          currentButton.setType(button.type);
          currentButton.setAction(button.action);
          launchpadO.sendMessage([button.type, button.id, button.color]);
      });
  });
}

/**
 * Function to push a 2D array of Button objects to the Launchpad
 * @param {Button[][]} buttonGrid - 2D array of Button objects
 */
function pushGridToLaunchpad(buttonGrid) {
  buttonGrid.forEach(row => {
      row.forEach(button => {
          const { id, color, type } = button;
          launchpadO.sendMessage([type, id, color]);
      });
  });
}
/**
 * Handle button press events
 * @param {number} row - Row index of the pressed button
 * @param {number} col - Column index of the pressed button
 * @param {Function} action - Function to execute when the button is pressed
 */
function setButtonPressAction(row, col, action) {
  const button = grid[row][col];
  button.setAction(action);
}

launchpadI.on('message', (DeltaTime, message) => {
  const [type, buttonNum, data2] = message;
  if (type === 144 && data2 > 0) { // Note On message with velocity > 0
    const row = Math.floor((buttonNum - 11) / 10);
    const col = (buttonNum - 11) % 10;
    if (grid[row] && grid[row][col]) {
      grid[row][col].runAction();
    }
  }
  //console.log(`Type: ${type}, Data1: ${buttonNum}, Data2: ${data2}`);
});

// Open the first available input port.

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
launchpadI.ignoreTypes(false, false, false);

/**
 * Switch the active view on the Launchpad
 * @param {string} viewName - Name of the view to switch to
 */
function switchView(viewName) {
  console.log('Switching to ', viewName);
  if (views[viewName]) {
      currentView = viewName;
      grid = views[currentView].getGrid();
      pushGridToLaunchpad(grid);
      startUpdateInterval(); // Start or restart the update interval
  } else {
      console.error(`View "${viewName}" does not exist.`);
      throw new Error("Unable to switch to view ", viewName)
  }
}

startUpdateInterval();

pushGridToLaunchpad(grid);

module.exports = {
  getInput,
  getOutput,
  setButtonColor,
  setButtonType,
  resetGrid,
  updateGrid,
  pushGridToLaunchpad,
  setButtonPressAction,
  startUpdateInterval,
  stopUpdateInterval,
  updateCurrentView,
  switchView,
};




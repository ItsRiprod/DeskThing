/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const launchpad = require('./launchpadUtil/launchpadIO');

// Views
const dashboard = require('./launchpadApps/dashboard');
const colors = require('./launchpadApps/colors');
const stopwatch = require('./launchpadApps/stopwatch');

const views = {
  dashboard,
  colors,
  stopwatch,
};

let currentView = 'dashboard';
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
    const updatedGrid = views[currentView].updateGrid(launchpad.grid); // Each view should implement an updateGrid function
    if (updatedGrid) {
      launchpad.updateGrid(updatedGrid);
    }
}

/**
 * Switch the active view on the Launchpad
 * @param {string} viewName - Name of the view to switch to
 */
function switchView(viewName) {
  console.log('Switching to ', viewName);
  if (views[viewName]) {
      currentView = viewName;
      launchpad.grid = views[currentView].getGrid();
      launchpad.pushGridToLaunchpad(launchpad.grid);
      startUpdateInterval(); // Start or restart the update interval
  } else {
      console.error(`View "${viewName}" does not exist.`);
      throw new Error("Unable to switch to view ", viewName)
  }
}

launchpad.grid = views[currentView].getGrid();
launchpad.pushGridToLaunchpad(launchpad.grid);
startUpdateInterval();

launchpad.getInput().on('message', (deltaTime, message) => {
  views[currentView].handleMessage(deltaTime, message);
});

module.exports = {
  getInput: () => launchpad.getInput(),
  getOutput: () => launchpad.getOutput(),
  setButtonColor: launchpad.setButtonColor.bind(launchpad),
  setButtonType: launchpad.setButtonType.bind(launchpad),
  resetGrid: launchpad.resetGrid.bind(launchpad),
  updateGrid: launchpad.updateGrid.bind(launchpad),
  pushGridToLaunchpad: launchpad.pushGridToLaunchpad.bind(launchpad),
  setButtonPressAction: launchpad.setButtonPressAction.bind(launchpad),
  startUpdateInterval,
  stopUpdateInterval,
  updateCurrentView,
  switchView,
};




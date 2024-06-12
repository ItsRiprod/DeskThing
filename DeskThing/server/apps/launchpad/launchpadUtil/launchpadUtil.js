import launchpad from './launchpadIO.js';

// Views
import dashboard from '../launchpadApps/dashboard.js';
import colors from '../launchpadApps/colors.js';
import stopwatch from '../launchpadApps/stopwatch.js';

const views = { // Add to this for more launchpad views
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

export {
  startUpdateInterval,
  stopUpdateInterval,
  updateCurrentView,
  switchView,
};




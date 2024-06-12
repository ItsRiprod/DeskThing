/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import Button from '../launchpadUtil/Button.js';
import launchpad from '../launchpadUtil/launchpadIO.js';

let curDuration;

function getGrid(color = 0) {
    // Define initial grid configuration
    const grid = [];
    for (let row = 0; row < 9; row++) {
        const gridRow = [];
        for (let col = 0; col < 9; col++) {
            const buttonId = row * 10 + col + 11;

            gridRow.push(new Button(buttonId, color, 144, function(change) {
                console.log(`ButtonId: ${buttonId}, Color: ${this.color}, Change: ${change}`);
                this.setColor(change);
                launchpad.sendMessage([buttonId, this.color, 144])
            }));
        }
        grid.push(gridRow);
    }
    return grid;
}

function updateGrid(grid) {
    // Return null to not update the grid
    // All the updating is done via the button function
    return null;
}

function handleMessage(deltaTime, message) {
    const [type, buttonNum, data2] = message;

    if (type === 144) { // Note On message
        if (data2 === 127) { // Button down
            const row = Math.floor((buttonNum - 11) / 10);
            const col = (buttonNum - 11) % 10;
            if (launchpad.grid[row] && launchpad.grid[row][col]) {
                curDuration = buttonNum; // Set current duration to buttonId
                startUpdateInterval(); // Start counting down
                launchpad.grid[row][col].runAction(curDuration);
            }
        } else if (data2 === 0) { // Button up
            //stopUpdateInterval(); // Stop the countdown
            // Perform any actions needed on button release
        }
    }
}

let updateInterval;
function startUpdateInterval() {
    launchpad.updateGrid(getGrid());
    stopUpdateInterval(); // Stop any existing interval

    updateInterval = setInterval(() => {
        if (curDuration > 11) {
            curDuration--;
            console.log(`Current Duration: ${curDuration -10}`);
            // Update the button color or perform other actions as needed
            updateCurrentView(curDuration);
        } else {
            launchpad.updateGrid(getGrid(6));
            stopUpdateInterval(); // Stop the interval when countdown reaches 0
        }
    }, 1000); // Update every second
}

function stopUpdateInterval() {
    clearInterval(updateInterval);
}

function updateCurrentView(duration) {
    // Example function to update the view based on the current duration
    const row = Math.floor((curDuration - 11) / 9);
    const col = (curDuration - 11) % 9;
    if (launchpad.grid[row] && launchpad.grid[row][col]) {
        launchpad.grid[row][col].setColor(duration); // Set color based on remaining duration
        launchpad.sendMessage([duration, duration, 144])
    }
}

export default { getGrid, updateGrid, handleMessage };

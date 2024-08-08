/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import Button from '../launchpadUtil/Button.js';
import launchpad from '../launchpadUtil/launchpadIO.js';

function getGrid() {
    // Define initial grid configuration
    const grid = [];
    for (let row = 0; row < 9; row++) {
        const gridRow = [];
        for (let col = 0; col < 9; col++) {
            const buttonId = row * 10 + col + 11;

            gridRow.push(new Button(buttonId, 0, 144, function(change) {

                this.setColor(this.color + change);
                launchpad.sendMessage([buttonId, this.color, 144])
                console.log(`ButtonId: ${buttonId}, Color: ${this.color}, Change: ${change}`);
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
                // Trigger action when button is pressed down
                // Set a timeout to handle long press after 1 second
                launchpad.grid[row][col].longPressTimeout = setTimeout(() => {
                    launchpad.grid[row][col].runAction(-1); // Long press action
                    clearTimeout(launchpad.grid[row][col].longPressTimeout);
                    launchpad.grid[row][col].longPressTimeout = null;
                }, 500);
            }
        } else if (data2 === 0) { // Button up
            const row = Math.floor((buttonNum - 11) / 10);
            const col = (buttonNum - 11) % 10;
            if (launchpad.grid[row] && launchpad.grid[row][col]) {
                if (launchpad.grid[row][col].longPressTimeout) {
                    // Clear the long press timeout if button is released early
                    clearTimeout(launchpad.grid[row][col].longPressTimeout);
                    launchpad.grid[row][col].runAction(1);
                }
            }
        }
    }
}


export default { getGrid, updateGrid, handleMessage };

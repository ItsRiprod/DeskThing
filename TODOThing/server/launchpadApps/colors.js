/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const Button = require('../launchpadUtil/Button');

function getGrid() {
    // Define initial grid configuration
    const grid = [];
    for (let row = 0; row < 9; row++) {
        const gridRow = [];
        for (let col = 0; col < 9; col++) {
            const buttonId = row * 10 + col + 11;
            let action = null;

            gridRow.push(new Button(buttonId, buttonId, 144, action));
        }
        grid.push(gridRow);
    }

    /* Testing new stuff */

    return grid;
}

function updateGrid(grid) {
    
   // do nothing
    return grid;
}

module.exports = { getGrid, updateGrid };
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import Button from '../launchpadUtil/Button.js';
import launchpad from '../launchpadUtil/launchpadIO.js';
import { totalmem, freemem, cpus as _cpus } from 'os';

let prevIdleTime = 0;
let prevTotalTime = 0;

const redShades = [7, 6, 5];
const greenShades = [23, 22, 21];
const yellowShades = [15, 14, 13];

function getGrid() {
    // Define initial grid configuration
    const grid = [];
    for (let row = 0; row < 9; row++) {
        const gridRow = [];
        for (let col = 0; col < 9; col++) {
            const buttonId = row * 10 + col + 11;
            let action = null;

            gridRow.push(new Button(buttonId, 0, 144, action));
        }
        grid.push(gridRow);
    }

    /* Testing new stuff */
    return grid;
}
function updateColumnButtons(button, usage, usageColor, row, col) {
    const colorVal = Math.ceil(((usage * 8) - row) * 3);
    const color = colorVal > 0 ? usageColor[colorVal - 1] || usageColor[2] : 0;
    const action = () => {
        const usageType = col === 0 ? 'CPU' : 'Memory';
        console.log(`${usageType} usage button pressed: ${100 * usage}%, colorVal: ${colorVal}`);
    };
    return new Button(button.id, color, 144, action, row, col);
}
function updateGrid(grid) {
    // Update the grid based on the current state
    const updatedGrid = [];
    const cpuUsage = getCpuPercentage();
    const memUsage = getMemPercentage();
    const cpuUsageColor = getCpuUsageColor(cpuUsage);
    const memUsageColor = getCpuUsageColor(memUsage);
    // Example: Update CPU usage buttons
    for (let row = 0; row < 9; row++) {
        const gridRow = [];
        for (let col = 0; col < 9; col++) {
            const button = grid[row][col];
            let updatedButton;

            if (col === 0 || col === 1) {
                // Column 1 buttons (CPU usage)
                updatedButton = updateColumnButtons(button, cpuUsage, cpuUsageColor, row, col);
            } else if (col === 2 || col === 3) {
                // Column 2 buttons (Memory usage)
                updatedButton = updateColumnButtons(button, memUsage, memUsageColor, row, col);
            } else {
                // Other buttons, maintain their state
                updatedButton = button;
            }
            gridRow.push(updatedButton);
        }
        updatedGrid.push(gridRow);
    }
    return updatedGrid;
}

function getCpuUsageColor(cpuUsage) {
    let color;

    // Determine the color based on CPU usage
    if (cpuUsage < 0.5) {
        color = greenShades;
    } else if (cpuUsage >= 0.5 && cpuUsage < 0.8) {
        color = yellowShades;
    } else {
        color = redShades;
    }

    return color;
}
function getMemPercentage() {
    const totalMemory = totalmem();
    const usedMemory = totalMemory - freemem();
    const percentage = usedMemory / totalMemory;
    return percentage;
}

function getCpuPercentage() {
    const cpus = _cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
            total += cpu.times[type];
        }
        idle += cpu.times.idle;
    }

    // Calculate the difference in idle and total time since last call
    const idleDifference = idle - prevIdleTime;
    const totalDifference = total - prevTotalTime;

    // Calculate the percentage CPU usage
    let percentageCpu = 100 - Math.ceil((100 * idleDifference) / totalDifference);

    // Update the previous idle and total times
    prevIdleTime = idle;
    prevTotalTime = total;

    percentageCpu /= 100;
    return percentageCpu;
}

// Handle button press events using the LaunchpadIO instance
function handleMessage(deltaTime, message) {
    const [type, buttonNum, data2] = message;
    if (type === 144 && data2 > 0) { // Note On message with velocity > 0
        const row = Math.floor((buttonNum - 11) / 10);
        const col = (buttonNum - 11) % 10;
        if (launchpad.grid[row] && launchpad.grid[row][col]) {
            launchpad.grid[row][col].runAction();
        }
    }
    console.log('Sent from dashboard')
}

export default { getGrid, updateGrid, handleMessage };



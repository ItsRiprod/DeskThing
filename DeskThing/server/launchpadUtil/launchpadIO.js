import Button from './Button.js';
import pkg from 'midi';
const { Input, Output } = pkg;
class LaunchpadIO {
    constructor() {
      this.launchpadI = new Input();
      this.launchpadO = new Output();
      this.launchpadI.openPort(1);
      this.launchpadO.openPort(2);
      this.grid = [];
  
      // Sysex, timing, and active sensing messages are ignored by default.
      this.launchpadI.ignoreTypes(false, false, false);
    }
  
    getInput() {
      return this.launchpadI;
    }
  
    getOutput() {
      return this.launchpadO;
    }
  
    initializeGrid(rows, cols) {
      this.grid = Array.from({ length: rows }, (_, row) => 
        Array.from({ length: cols }, (_, col) => {
          const buttonId = row * 10 + col + 11;
          return new Button(buttonId, buttonId, 144, () => {
            console.log(`ButtonID: ${buttonId}`);
            this.setColor(buttonId + 1);
          });
        })
      );
    }
    
    setButtonColor(row, col, color) {
      const button = this.grid[row][col];
      button.setColor(color);
      this.sendMessage([button.type, button.id, color]);
    }
  
    setButtonType(row, col, type) {
      const button = this.grid[row][col];
      button.setType(type);
      this.sendMessage([type, button.id, button.color]);
    }

    sendMessage( [type, id, color] ) {
        this.launchpadO.sendMessage( [type, id, color] )
    }
  
    resetGrid() {
      this.grid.forEach(row => {
        row.forEach(button => {
          button.setColor(0);
          button.setType(144);
          this.sendMessage([144, button.id, 0]);
        });
      });
    }
  
    updateGrid(buttonGrid = this.grid) {
      buttonGrid.forEach((row, rowIndex) => {
        row.forEach((button, colIndex) => {
          const currentButton = this.grid[rowIndex][colIndex];
          currentButton.setColor(button.color);
          currentButton.setType(button.type);
          currentButton.setAction(button.action);
          this.sendMessage([button.type, button.id, button.color]);
        });
      });
    }
  
    pushGridToLaunchpad(buttonGrid) {
      buttonGrid.forEach(row => {
        row.forEach(button => {
          const { id, color, type } = button;
          this.sendMessage([type, id, color]);
        });
      });
    }
  
    setButtonPressAction(row, col, action) {
      const button = this.grid[row][col];
      button.setAction(action);
    }

  }
const launchpadInstance = new LaunchpadIO();
export default launchpadInstance;
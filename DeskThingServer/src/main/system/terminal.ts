// In your main process (src/main/index.ts)
import { app } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import { writeFileSync, chmodSync } from 'node:fs'

// Check for terminal mode at startup
const isTerminalMode = process.argv.includes('--terminal-mode')

export const relaunchWithTerminal = async (): Promise<void> => {
  const tempDir = app.getPath('temp') || os.tmpdir()
  const execPath = process.execPath
  const args = [...process.argv.slice(1), '--terminal-mode']

  try {
    // Release single instance lock before restarting
    app.releaseSingleInstanceLock()

    const platform = process.platform

    if (platform === 'win32') {
      // Windows - Create batch script that launches in new terminal
      const scriptContent = `
@echo off
echo Starting DeskThing with console logging...
echo.
"${execPath}" ${args.map((arg) => `"${arg}"`).join(' ')}
echo.
echo DeskThing has closed. Press any key to exit...
pause > nul
      `.trim()

      // Write temp batch file
      const tempBatPath = path.join(tempDir, 'deskthing-console.bat')
      writeFileSync(tempBatPath, scriptContent)

      // Launch in new Command Prompt window
      spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', tempBatPath], {
        detached: true,
        stdio: 'ignore'
      })
    } else if (platform === 'darwin') {
      // macOS - Create shell script for Terminal
      const scriptContent = `
#!/bin/bash
echo "Starting DeskThing with console logging..."
echo ""
"${execPath}" ${args.map((arg) => `"${arg}"`).join(' ')}
echo ""
echo "DeskThing has closed. Press any key to exit..."
read -n 1
      `.trim()

      // Write temp script file
      const tempScriptPath = path.join(tempDir, 'deskthing-console.sh')
      writeFileSync(tempScriptPath, scriptContent)
      chmodSync(tempScriptPath, '755')

      // Launch in Terminal.app
      spawn('open', ['-a', 'Terminal', tempScriptPath], {
        detached: true,
        stdio: 'ignore'
      })
    } else {
      // Linux - Try different terminal emulators
      const terminals = [
        ['gnome-terminal', '--'],
        ['konsole', '-e'],
        ['xterm', '-e'],
        ['x-terminal-emulator', '-e']
      ]

      for (const [terminal, flag] of terminals) {
        try {
          spawn(terminal, [flag, execPath, ...args], {
            detached: true,
            stdio: 'ignore'
          })
          break
        } catch (error) {
          console.warn(`Failed to launch ${terminal}:`, error)
          continue
        }
      }
    }

    // Quit current instance after launching replacement
    app.quit()
  } catch (error) {
    console.error('Failed to relaunch with terminal:', error)
    throw error
  }
}

// Enable console output in terminal mode
if (isTerminalMode) {
  console.log('🖥️  DeskThing running in Terminal Debug Mode')
  console.log('📝 Console output is visible in this terminal window')
  console.log('❌ Close this terminal to exit DeskThing')
  console.log('─'.repeat(50))

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    app.quit()
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
    app.quit()
  })
}

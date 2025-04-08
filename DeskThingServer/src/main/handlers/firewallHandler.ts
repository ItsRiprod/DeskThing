console.log('[Firewall Handler] Starting')
import { exec } from 'child_process'
import os from 'os'
import Logger from '@server/utils/logger'
import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { LOGGING_LEVELS } from '@deskthing/types'
import { ProgressChannel } from '@shared/types'
import { progressBus } from '@server/services/events/progressBus'

/**
 * Executes a shell command and returns the stdout output as a Promise.
 *
 * @param command - The shell command to execute.
 * @returns A Promise that resolves with the stdout output of the command, or rejects with an error message if the command fails.
 */
function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`)
        return
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`)
        return
      }
      resolve(stdout)
    })
  })
}

/**
 * Checks if a firewall rule for the specified port exists on the current platform.
 *
 * @param port - The port number to check for a firewall rule.
 * @returns `true` if the firewall rule exists, `false` otherwise.
 */
async function checkFirewallRuleExists(port: number): Promise<boolean> {
  const platform = os.platform()
  let checkCommand: string

  try {
    if (platform === 'win32') {
      // PowerShell command for Windows
      checkCommand = `"Get-NetFirewallRule -DisplayName 'Deskthing Server Inbound'"`
      const result = await runCommand(`powershell -Command ${checkCommand}`)

      return result.trim() !== ''
    } else if (platform === 'linux') {
      // Bash command for iptables on Linux
      checkCommand = `sudo iptables -C INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null && echo "true" || echo "false"`
      const result = await runCommand(checkCommand)
      return result.trim() === 'true'
    } else if (platform === 'darwin') {
      // Bash command for pfctl on macOS
      checkCommand = `sudo pfctl -sr | grep -q "rdr pass on lo0 inet proto tcp from any to any port ${port} -> 127.0.0.1 port ${port}" && echo "true" || echo "false"`
      const result = await runCommand(checkCommand)
      return result.trim() === 'true'
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, `FIREWALL: Unsupported OS!`)
      console.error('Unsupported OS')
      return false
    }
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * Sets up the firewall rules for the specified port on the current platform.
 *
 * This function checks if the firewall rule for the specified port already exists, and if not, it creates the necessary rules for both inbound and outbound traffic. The function handles the setup process for different operating systems (Windows, Linux, macOS) using platform-specific commands.
 *
 * @param port - The port number to set up the firewall rules for.
 * @channel - {@link ProgressChannel.FIREWALL}
 * @returns A Promise that resolves when the firewall setup is complete.
 */
export async function setupFirewall(port: number): Promise<void> {
  const platform = os.platform()
  const inboundRuleName = 'Deskthing Server Inbound'
  const outboundRuleName = 'Deskthing Server Outbound'

  progressBus.start(ProgressChannel.FIREWALL, 'Configure Firewall', 'Initializing')

  try {
    progressBus.update(ProgressChannel.FIREWALL, 'Checking if rules exist', 10)
    const ruleExists = await checkFirewallRuleExists(port)
    if (ruleExists) {
      Logger.debug(` Firewall rule for port ${port} verified successfully`, {
        source: 'setupFirewall'
      })
      progressBus.update(ProgressChannel.FIREWALL, 'Verified that the rule exists!', 20)
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, `FIREWALL: Failed to verify firewall rule for port ${port}!`)
    }

    if (platform === 'win32') {
      // PowerShell script for Windows
      /*

      New-NetFirewallRule -DisplayName "Deskthing Server Inbound" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8891
      New-NetFirewallRule -DisplayName "Deskthing Server Outbound" -Direction Outbound -Action Allow -Protocol TCP -LocalPort 8891


      */
      progressBus.update(ProgressChannel.FIREWALL, 'Writing temp script', 30)
      const script = `
        $inboundRuleName = "${inboundRuleName}"
        $outboundRuleName = "${outboundRuleName}"
        $port = ${port}

        if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
        {
          $arguments = "& '" +$myinvocation.mycommand.definition + "'"
          Start-Process powershell -Verb runAs -ArgumentList $arguments
          Break
        }

        New-NetFirewallRule -DisplayName $inboundRuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port
        New-NetFirewallRule -DisplayName $outboundRuleName -Direction Outbound -Action Allow -Protocol TCP -LocalPort $port

      `

      const tempScriptPath = join(app.getPath('temp'), 'setup-firewall.ps1')
      fs.writeFileSync(tempScriptPath, script)

      try {
        progressBus.update(ProgressChannel.FIREWALL, 'Running setup for windows', 40)
        await runCommand(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`)
        Logger.debug('Firewall rules set up successfully on Windows', {
          source: 'setupFirewall'
        })

        progressBus.update(ProgressChannel.FIREWALL, 'Firewall ran without error', 60)
      } finally {
        fs.unlinkSync(tempScriptPath)
      }
    } else if (platform === 'linux') {
      progressBus.update(ProgressChannel.FIREWALL, 'Running setup scripts for Linux', 30)
      // Bash script for iptables on Linux
      const script = `
        #!/bin/bash
        port=${port}

        if ! sudo iptables -C INPUT -p tcp --dport $port -j ACCEPT 2>/dev/null; then
          sudo iptables -A INPUT -p tcp --dport $port -j ACCEPT
        fi
        if ! sudo iptables -C OUTPUT -p tcp --dport $port -j ACCEPT 2>/dev/null; then
          sudo iptables -A OUTPUT -p tcp --dport $port -j ACCEPT
        fi
      `

      progressBus.update(ProgressChannel.FIREWALL, 'Running setup scripts for Linux', 50)
      await runCommand(`echo "${script}" | bash`)
      Logger.debug('Firewall rules set up successfully on Linux', {
        source: 'setupFirewall'
      })
    } else if (platform === 'darwin') {
      progressBus.update(
        ProgressChannel.FIREWALL,
        'Running setup scripts for MacOS (WARN: RNDIS does not work on MacOS)',
        50
      )

      // Bash script for pfctl on macOS
      const script = `
      #!/bin/bash
      port=${port}
      anchorName="DeskthingServerAnchor"

        if ! sudo pfctl -s all | grep -q "rdr pass on lo0 inet proto tcp from any to any port $port -> 127.0.0.1 port $port"; then
        echo "rdr pass on lo0 inet proto tcp from any to any port $port -> 127.0.0.1 port $port" | sudo pfctl -a $anchorName -f -
        sudo pfctl -e
        fi
      `

      await runCommand(`echo "${script}" | bash`)
      progressBus.update(ProgressChannel.FIREWALL, 'Finished configuring firewall', 70)
      Logger.debug('Firewall rules set up successfully on macOS', {
        source: 'setupFirewall'
      })
    } else {
      progressBus.error(ProgressChannel.FIREWALL, 'Configure Firewall', 'Unsupported OS')
      console.error('Unsupported OS')
    }
  } catch (error) {
    Logger.log(
      LOGGING_LEVELS.ERROR,
      `FIREWALL: Error encountered trying to setup firewall for ${port}! Run administrator and try again`
    )
    progressBus.error(
      ProgressChannel.FIREWALL,
      'Configure Firewall',
      'Error in firewall',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }

  progressBus.complete(ProgressChannel.FIREWALL, 'Finished configuring firewall')
}

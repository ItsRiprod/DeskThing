console.log('[Firewall Handler] Starting')
import { exec } from 'child_process'
import os from 'os'
import loggingStore from '../stores/loggingStore'
import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { ReplyFn, MESSAGE_TYPES } from '@shared/types'

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
      loggingStore.log(MESSAGE_TYPES.ERROR, `FIREWALL: Unsupported OS!`)
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
 * @param reply - An optional callback function to provide logging information during the setup process.
 * @returns A Promise that resolves when the firewall setup is complete.
 */
async function setupFirewall(port: number, reply?: ReplyFn): Promise<void> {
  const platform = os.platform()
  const inboundRuleName = 'Deskthing Server Inbound'
  const outboundRuleName = 'Deskthing Server Outbound'

  try {
    reply && reply('logging', { status: true, data: 'Checking if rules exist', final: false })
    const ruleExists = await checkFirewallRuleExists(port)
    if (ruleExists) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `FIREWALL: Firewall rule for port ${port} verified successfully`
      )
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `Firewall rule for port ${port} verified successfully`
      )
      reply &&
        reply('logging', { status: true, data: 'Verified that the rule exists!', final: false })
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `FIREWALL: Failed to verify firewall rule for port ${port}!`
      )
      console.error(`Failed to verify firewall rule for port ${port}`)
    }

    if (platform === 'win32') {
      // PowerShell script for Windows
      /*

      New-NetFirewallRule -DisplayName "Deskthing Server Inbound" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8891
      New-NetFirewallRule -DisplayName "Deskthing Server Outbound" -Direction Outbound -Action Allow -Protocol TCP -LocalPort 8891


      */
      reply && reply('logging', { status: true, data: 'Running setup for windows', final: false })
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
        await runCommand(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`)
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `FIREWALL: Firewall rules set up successfully on Windows`
        )
        loggingStore.log(MESSAGE_TYPES.LOGGING, 'Firewall rules set up successfully on Windows')

        reply &&
          reply('logging', { status: true, data: 'Firewall ran without error', final: false })
      } finally {
        fs.unlinkSync(tempScriptPath)
      }
    } else if (platform === 'linux') {
      reply &&
        reply('logging', { status: true, data: 'Running setup scripts for Linux', final: false })
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

      await runCommand(`echo "${script}" | bash`)
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `FIREWALL: Firewall rules set up successfully on Linux`
      )
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'Firewall rules set up successfully on Linux')
    } else if (platform === 'darwin') {
      reply &&
        reply('logging', {
          status: true,
          data: 'Running setup scripts for MacOS (WARN: RNDIS does not work on MacOS)',
          final: false
        })
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
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `FIREWALL: Firewall rules set up successfully on macOS`
      )
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'Firewall rules set up successfully on macOS')
    } else {
      console.error('Unsupported OS')
    }
  } catch (error) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `FIREWALL: Error encountered trying to setup firewall for ${port}! Run administrator and try again`
    )
    if (error instanceof Error) {
      reply &&
        reply('logging', {
          status: false,
          data: 'Error in firewall',
          error: error.message,
          final: true
        })
    }
    console.error(error)
  }

  reply && reply('logging', { status: true, data: 'Firewall run successfully!', final: true })
}
export { setupFirewall }

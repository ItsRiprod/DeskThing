import { exec } from 'child_process'
import os from 'os'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'

// Function to execute shell commands
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
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `FIREWALL: Unsupported OS!`)
      console.error('Unsupported OS')
      return false
    }
  } catch (error) {
    console.error(error)
    return false
  }
}

// Firewall setup function
async function setupFirewall(port: number): Promise<void> {
  const platform = os.platform()
  const inboundRuleName = 'Deskthing Server Inbound'
  const outboundRuleName = 'Deskthing Server Outbound'

  try {
    const ruleExists = await checkFirewallRuleExists(port)
    if (ruleExists) {
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `FIREWALL: Firewall rule for port ${port} verified successfully`
      )
      console.log(`Firewall rule for port ${port} verified successfully`)
      return
    } else {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `FIREWALL: Failed to verify firewall rule for port ${port}!`
      )
      console.error(`Failed to verify firewall rule for port ${port}`)
    }

    if (platform === 'win32') {
      // PowerShell script for Windows
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
        dataListener.asyncEmit(
          MESSAGE_TYPES.LOGGING,
          `FIREWALL: Firewall rules set up successfully on Windows`
        )
        console.log('Firewall rules set up successfully on Windows')
      } finally {
        fs.unlinkSync(tempScriptPath)
      }
    } else if (platform === 'linux') {
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
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `FIREWALL: Firewall rules set up successfully on Linux`
      )
      console.log('Firewall rules set up successfully on Linux')
    } else if (platform === 'darwin') {
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
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `FIREWALL: Firewall rules set up successfully on macOS`
      )
      console.log('Firewall rules set up successfully on macOS')
    } else {
      console.error('Unsupported OS')
    }
  } catch (error) {
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      `FIREWALL: Error encountered trying to setup firewall for ${port}! Run administrator and try again`
    )
    console.error(error)
  }
}

export { setupFirewall }

import { handleAdbCommands } from '@server/handlers/adbHandler'
import Logger from '@server/utils/logger'
import { LOGGING_LEVELS } from '@deskthing/types'
import { BluetoothProvisionResult, BluetoothProvisionStep } from '@shared/types'
import { deviceAgentScriptPath, deviceMuxScriptPath } from './bridgeProcess'

/**
 * One-time device provisioning for the Bluetooth transport.
 *
 * Runs over adb while the Car Thing is on USB, and leaves the device able to
 * reach the server over Bluetooth on every subsequent boot: the mux and the
 * pairing agent are installed under supervisord, and bluetoothd gains the
 * compat flag it needs to advertise a serial port.
 *
 * Pairing itself is not done here — it is computer-initiated from the setup
 * wizard (the device screen shows the code, the person confirms here), which
 * is the same flow the Car Thing shipped with. Provisioning ends by reporting
 * the device's radio address so the wizard knows who to pair with.
 *
 * Every step is recorded so the UI can show exactly what happened; a failed
 * step stops the sequence.
 */

/** RFCOMM channel the device listens on; must match the helper and the mux. */
const RFCOMM_CHANNEL = 3

const MUX_REMOTE_PATH = '/etc/deskthing-bt/btmux.py'
const AGENT_REMOTE_PATH = '/etc/deskthing-bt/btagent.py'

const supervisorConf = (name: string, command: string): string =>
  `[program:${name}]\\n` +
  `command=${command}\\n` +
  'autostart=true\\n' +
  'autorestart=true\\n' +
  'startretries=999\\n' +
  'stopasgroup=true\\n' +
  'killasgroup=true\\n' +
  'redirect_stderr=true\\n' +
  `stdout_logfile=/var/log/${name}.log\\n` +
  'stdout_logfile_maxbytes=512KB\\n' +
  'stdout_logfile_backups=1\\n'

type StepRunner = () => Promise<string>

const runSteps = async (
  steps: Array<{ id: string; label: string; run: StepRunner }>
): Promise<BluetoothProvisionResult> => {
  const results: BluetoothProvisionStep[] = []
  for (const step of steps) {
    try {
      const detail = await step.run()
      results.push({ id: step.id, label: step.label, ok: true, detail })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      Logger.log(LOGGING_LEVELS.ERROR, `[btProvision] ${step.id} failed: ${detail}`)
      results.push({ id: step.id, label: step.label, ok: false, detail })
      return { success: false, steps: results }
    }
  }
  return { success: true, steps: results }
}

export const provisionDevice = async (adbId: string): Promise<BluetoothProvisionResult> => {
  const adb = (args: string): Promise<string> => handleAdbCommands(`-s ${adbId} ${args}`)

  let deviceAddress: string | null = null

  const steps: Array<{ id: string; label: string; run: StepRunner }> = [
    {
      id: 'remount',
      label: 'Make device filesystem writable',
      run: () => adb('shell mount -o remount,rw /')
    },
    {
      id: 'push-mux',
      label: 'Install Bluetooth services on device',
      run: async () => {
        await adb('shell mkdir -p /etc/deskthing-bt')
        await adb(`push "${deviceMuxScriptPath}" ${MUX_REMOTE_PATH}`)
        return adb(`push "${deviceAgentScriptPath}" ${AGENT_REMOTE_PATH}`)
      }
    },
    {
      id: 'supervisor',
      label: 'Register services to start at boot',
      run: async () => {
        await adb('shell mkdir -p /etc/supervisor.d')
        await adb(
          `shell "printf '${supervisorConf('btmux', `/usr/bin/python3 ${MUX_REMOTE_PATH} 8891`)}' > /etc/supervisor.d/btmux.conf"`
        )
        return adb(
          `shell "printf '${supervisorConf('btagent', `/usr/bin/python3 ${AGENT_REMOTE_PATH}`)}' > /etc/supervisor.d/btagent.conf"`
        )
      }
    },
    {
      id: 'bluetoothd-compat',
      label: 'Enable serial port support in device Bluetooth',
      run: async () => {
        // The stock image runs bluetoothd without --compat, which the SDP
        // registration in the mux needs. Idempotent: only patch once.
        const script = await adb('shell cat /etc/start_bluetoothd.sh')
        if (!script.includes('--compat')) {
          await adb(
            `shell "sed -i 's|bluetoothd -n -d|bluetoothd -n -d --compat|' /etc/start_bluetoothd.sh"`
          )
          // Restarting via supervisor orphans the old daemon; kill it explicitly.
          await adb(
            `shell "for p in \\$(pidof bluetoothd); do kill \\$p; done; supervisorctl restart bluetoothd"`
          )
          return 'patched and restarted'
        }
        return 'already enabled'
      }
    },
    {
      id: 'start-services',
      label: 'Start the Bluetooth services',
      run: async () => {
        await adb('shell supervisorctl reread')
        await adb('shell supervisorctl update')
        await adb('shell "supervisorctl restart btmux || supervisorctl start btmux"')
        await adb('shell "supervisorctl restart btagent || supervisorctl start btagent"')
        const status = await adb('shell "supervisorctl status btmux btagent"')
        const running = (status.match(/RUNNING/g) || []).length
        if (running < 2) throw new Error(`services not running: ${status.trim()}`)
        return status.trim()
      }
    },
    {
      id: 'verify-radio',
      label: 'Verify device radio is connectable',
      run: async () => {
        const flags = await adb('shell hciconfig hci0')
        if (!flags.includes('PSCAN')) throw new Error('page scan not enabled')
        const records = await adb('shell sdptool browse local')
        if (!records.includes('Serial Port')) throw new Error('serial port not advertised')
        return `serial port on channel ${RFCOMM_CHANNEL}, radio connectable`
      }
    },
    {
      id: 'read-address',
      label: 'Read device Bluetooth address',
      run: async () => {
        const out = await adb('shell hciconfig hci0')
        const match = out.match(/BD Address:\s*((?:[0-9A-F]{2}:){5}[0-9A-F]{2})/i)
        if (!match) throw new Error('could not read radio address')
        deviceAddress = match[1].toUpperCase()
        return deviceAddress
      }
    }
  ]

  const result = await runSteps(steps)
  if (result.success && deviceAddress) result.deviceAddress = deviceAddress
  Logger.log(
    result.success ? LOGGING_LEVELS.LOG : LOGGING_LEVELS.WARN,
    `[btProvision] ${adbId}: ${result.success ? 'complete' : 'failed'} (${result.steps.length} steps)`
  )
  return result
}

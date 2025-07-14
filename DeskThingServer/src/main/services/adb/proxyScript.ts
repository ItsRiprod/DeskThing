import { ScriptInterface } from '@shared/interfaces/scriptInterface'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'
import { getResourcesPath } from '@server/utils/resourcePath'

export const proxyScript: ScriptInterface = async (adbService, { deviceId }) => {
  try {
    progressBus.start(ProgressChannel.PUSH_SCRIPT, 'Proxy Script', 'Setting up proxy configuration')

    progressBus.warn(
      ProgressChannel.PUSH_SCRIPT,
      'This script is not yet useful. Reevaluate your life choices and come back later',
      'Proxy script is not yet implemented'
    )

    const resourcePath = getResourcesPath('scripts', 'setup-proxy.sh')
    const targetScriptPath = '/etc/setup-proxy.sh'
    const proxyConfPath = '/etc/supervisor.d/setup-proxy.conf'
    const tempScriptPath = '/tmp/setup-proxy.sh'

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Pushing proxy script to device', 20)
    await adbService.sendCommand(`push "${resourcePath}" ${tempScriptPath}`, deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Setting permissions', 30)
    await adbService.sendCommand(`shell chmod +x ${tempScriptPath}`, deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Remounting filesystem', 40)
    await adbService.sendCommand('shell mount -o remount,rw /', deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Moving script to final location', 50)
    await adbService.sendCommand(`shell mv ${tempScriptPath} ${targetScriptPath}`, deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Creating supervisor configuration', 60)
    const supervisorConfig = `[program:setupProxy]
command=${targetScriptPath}
autostart=true
autorestart=true
stderr_logfile=/var/log/setup-proxy.err.log
stdout_logfile=/var/log/setup-proxy.out.log
user=root`

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Creating log directory', 70)
    await adbService.sendCommand('shell mkdir -p /var/log', deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Writing supervisor configuration', 80)
    await adbService.sendCommand(`shell echo '${supervisorConfig}' > ${proxyConfPath}`, deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Updating supervisor', 90)
    await adbService.sendCommand('shell supervisorctl reread', deviceId)
    await adbService.sendCommand('shell supervisorctl update', deviceId)
    await adbService.sendCommand('shell supervisorctl start setupProxy', deviceId)

    progressBus.complete(ProgressChannel.PUSH_SCRIPT, 'Proxy configuration completed successfully')
    return 'Proxy script completed successfully'
  } catch (error) {
    const errorMessage = `Failed to execute proxy script: ${error}`
    progressBus.error(ProgressChannel.PUSH_SCRIPT, 'Failed to execute proxy script', errorMessage)
    throw new Error(errorMessage)
  }
}

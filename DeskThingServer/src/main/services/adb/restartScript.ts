import { ScriptInterface } from '@shared/interfaces/scriptInterface'
import { join } from 'path'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'
import logger from '@server/utils/logger'
import { handleError } from '@server/utils/errorHandler'
import { getResourcesPath } from '@server/utils/resourcePath'

/**
 * Restart Script
 * @param adbService - The ADBService instance.
 * @param deviceId - The ID of the device.
 * @returns A string indicating the status of the script.
 */
export const restartScript: ScriptInterface = async (adbService, deviceId, force = false) => {
  try {
    progressBus.start(
      ProgressChannel.PUSH_SCRIPT,
      'Restart Script',
      'Checking if script is already installed'
    )

    // Check if the script is already installed by checking for key marker files
    try {
      const isInstalled = await checkIfScriptInstalled(adbService, deviceId)

      if (isInstalled && !force) {
        const message = 'USB gadget configuration appears to be already installed on this device'
        progressBus.complete(ProgressChannel.PUSH_SCRIPT, message)
        return 'Script already installed. Use force=true to reinstall'
      }

      if (isInstalled) {
        logger.info('Forcing reinstallation of USB gadget configuration', {
          function: 'restartScript',
          source: 'restartScript'
        })
      }
    } catch (error) {
      // Continue anyways if there is an error checking
      progressBus.warn(
        ProgressChannel.PUSH_SCRIPT,
        'Error checking if script already exists. Continuing anyways.',
        handleError(error)
      )
    }

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Starting USB gadget configuration', 5)
    
    const resourcePath = getResourcesPath('scripts', 'restart_script')
    
    progressBus.update(ProgressChannel.PUSH_SCRIPT, `Using the path ${resourcePath}`, 5)

    // Remount filesystem as read-write
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Remounting filesystem', 10)
    await adbService.sendCommand('shell mount -o remount,rw /', deviceId)

    // Unmount existing S49usbgadget if mounted
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Checking mount points', 20)
    await adbService.sendCommand(
      'shell "mountpoint /etc/init.d/S49usbgadget 2>/dev/null || umount /etc/init.d/S49usbgadget"',
      deviceId
    )

    // Create required directory
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Creating directories', 30)
    await adbService.sendCommand('shell mkdir -p /etc/udhcpc', deviceId)

    // Push files to device
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Pushing files to device', 40)
    const directories = ['bin', 'etc', 'sbin', 'tmp']
    for (const dir of directories) {
      await adbService.sendCommand(`push "${join(resourcePath, 'rootfs', dir)}" /`, deviceId)
    }

    // Set executable permissions
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Setting permissions', 60)
    const executableFiles = [
      '/tmp/busybox',
      '/bin/coredhcp',
      '/etc/init.d/S49usbgadget',
      '/etc/udhcpc/default.script',
      '/etc/udev/rules.d/50-usb.rules',
      '/sbin/restart_usb'
    ]
    for (const file of executableFiles) {
      await adbService.sendCommand(`shell chmod +x ${file}`, deviceId)
    }

    // Move and install busybox
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Installing busybox', 70)
    await adbService.sendCommand('shell mv /tmp/busybox /bin', deviceId)
    await adbService.sendCommand('shell busybox --install', deviceId)

    // Sync and wait
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Syncing filesystem', 80)
    await adbService.sendCommand('shell sync', deviceId)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Remount as read-only and reboot
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Finalizing and rebooting', 90)
    await adbService.sendCommand('shell mount -o remount,ro /', deviceId)
    await adbService.sendCommand('shell reboot', deviceId)

    progressBus.complete(ProgressChannel.PUSH_SCRIPT, 'Device configured and rebooting')
    return 'Restart script completed successfully'
  } catch (error) {
    const errorMessage = `Failed to execute restart script: ${error}`
    progressBus.error(ProgressChannel.PUSH_SCRIPT, 'Failed to execute restart script', errorMessage)
    throw new Error(errorMessage)
  }
}

/**
 * Checks if the restart script is already installed on the device.
 *
 * @param adbService The ADB service instance
 * @param deviceId The device ID
 * @returns Promise resolving to true if script appears to be installed
 */
async function checkIfScriptInstalled(adbService, deviceId): Promise<boolean> {
  try {
    // Check for existence of key marker files that would only be present
    // if our script was successfully installed

    // Check for the init script, which is a unique identifier for our configuration
    const initScriptResult = await adbService.sendCommand(
      'shell "[ -x /etc/init.d/S49usbgadget ] && echo exists || echo not_found"',
      deviceId
    )

    // Check for the dhcp script
    const dhcpScriptResult = await adbService.sendCommand(
      'shell "[ -x /etc/udhcpc/default.script ] && echo exists || echo not_found"',
      deviceId
    )

    // Check for the restart utility
    const restartUtilResult = await adbService.sendCommand(
      'shell "[ -x /sbin/restart_usb ] && echo exists || echo not_found"',
      deviceId
    )

    // If all three key files exist and are executable, the script is likely installed
    return (
      initScriptResult.trim() === 'exists' &&
      dhcpScriptResult.trim() === 'exists' &&
      restartUtilResult.trim() === 'exists'
    )
  } catch (error) {
    // If there's an error checking, we'll assume it's not installed to be safe
    logger.warn(`Error checking if script is installed: ${error}`, {
      function: 'checkIfScriptInstalled',
      source: 'restartScript'
    })
    return false
  }
}

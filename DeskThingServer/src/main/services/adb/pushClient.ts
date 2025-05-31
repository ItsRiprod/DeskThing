/**
 * Not fully implemented just yet
 * Please stand by
 */

import { ScriptInterface } from '@shared/interfaces/scriptInterface'
import { ProgressChannel } from '@shared/types'
import { progressBus } from '@server/services/events/progressBus'
import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import { ClientConnectionMethod } from '@deskthing/types'
import {
  getClientManifest,
  setManifestJS,
  updateManifest
} from '@server/services/client/clientService'

export const pushClientScript: ScriptInterface = async (adbService, deviceId) => {
  progressBus.start(ProgressChannel.PUSH_SCRIPT, 'Configure Device', 'Opening port')

  await adbService.openPort(deviceId, 8891)

  progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Finding Client', 10)

  const userDataPath = app.getPath('userData')
  const manifestPath = join(userDataPath, 'webapp', 'manifest.json')
  const clientExists = fs.existsSync(manifestPath)

  if (!clientExists) {
    progressBus.error(ProgressChannel.PUSH_SCRIPT, 'Client not found', 'Client not found')
    throw new Error('Client not found')
  }

  progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Getting device version', 20)

  const deviceVersion = await adbService.getDeviceManifestVersion(deviceId)
  progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Getting device manifest', 30)
  const clientManifest = await getClientManifest()

  progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Checking for updates', 40)

  if (clientManifest && deviceVersion !== clientManifest.version) {
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Extracting webapp', 40)
    const extractDir = join(userDataPath, 'webapp')

    // Modify the manifest
    await setManifestJS({
      connectionId: deviceId,
      context: {
        method: ClientConnectionMethod.ADB,
        name: 'Car Thing',
        id: 4,
        ip: 'localhost',
        port: 8891
      }
    })

    await updateManifest({
      connectionId: deviceId,
      context: {
        method: ClientConnectionMethod.ADB,
        name: 'Car Thing',
        id: 4,
        ip: 'localhost',
        port: 8891
      }
    })

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Pushing webapp', 50)
    await adbService.pushWebApp(deviceId, extractDir)

    // revert the manifest changes
    await setManifestJS({
      connectionId: clientManifest.connectionId,
      context: clientManifest.context
    })
  }

  progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Restarting Chromium', 90)
  await adbService.restartChromium(deviceId)
  progressBus.complete(ProgressChannel.PUSH_SCRIPT, 'Configuration complete!')

  return 'Push client script completed successfully'
}

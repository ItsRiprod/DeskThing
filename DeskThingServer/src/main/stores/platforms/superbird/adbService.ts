import { handleAdbCommands } from '../../../handlers/adbHandler'
import logger from '@server/utils/logger'
import { ADBClientType, ClientConnectionMethod, ClientPlatformIDs } from '@deskthing/types'
import { join } from 'path'
import { app } from 'electron'
import * as fs from 'fs'
import { ClientManifest } from '@deskthing/types'
import {
  getClientManifest,
  setManifestJS,
  updateManifest
} from '@server/services/client/clientService'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'

export class ADBService {
  private commandQueues: {
    [deviceId: string]: {
      command: string
      resolve: (value: string) => void
      reject: (error: unknown) => void
    }[]
  } = {}

  public async sendCommand(command: string, deviceId?: string): Promise<string> {
    const queueKey = deviceId || 'default'

    return new Promise((resolve, reject) => {
      const queueItem = { command, resolve, reject }

      if (!this.commandQueues[queueKey]) {
        this.commandQueues[queueKey] = []
      }

      this.commandQueues[queueKey].push(queueItem)

      if (this.commandQueues[queueKey].length === 1) {
        this.processNextCommand(queueKey)
      }
    })
  }

  private async processNextCommand(queueKey: string): Promise<void> {
    const currentItem = this.commandQueues[queueKey][0]
    if (!currentItem) return

    try {
      let finalCommand = currentItem.command
      if (queueKey !== 'default') {
        finalCommand = `-s ${queueKey} ${finalCommand}`
      }

      const result = await handleAdbCommands(finalCommand)
      currentItem.resolve(result)
    } catch (error) {
      currentItem.reject(error)
    } finally {
      this.commandQueues[queueKey].shift()
      if (this.commandQueues[queueKey].length > 0) {
        this.processNextCommand(queueKey)
      }
    }
  }
  public async getDevices(): Promise<ADBClientType[]> {
    try {
      const response = await this.sendCommand('devices -l')
      const lines = response
        .split('\n')
        .filter(
          (line) => line && !line.startsWith('List of devices attached') && line.trim() !== ''
        )

      const adbDevices: ADBClientType[] = lines.reduce((acc, line) => {
        if (line.includes('device')) {
          const deviceId = line.replace('device', '').trim()

          const adbClient: ADBClientType = {
            id: ClientPlatformIDs.CarThing,
            name: 'Superbird Device',
            ip: '',
            port: -1,
            adbId: deviceId.split(' ')[0],
            offline: deviceId.includes('offline'),
            method: ClientConnectionMethod.ADB
          }

          return [...acc, adbClient]
        } else {
          return acc
        }
      }, [] as ADBClientType[])

      return adbDevices
    } catch (error) {
      logger.error('Failed to get ADB devices', {
        error: error as Error,
        function: 'getDevices',
        source: 'ADBService'
      })
      return []
    }
  }

  public async openPort(deviceId: string, port: number): Promise<void> {
    await this.sendCommand(`reverse tcp:${port} tcp:${port}`, deviceId)
  }

  public async restartChromium(deviceId: string): Promise<void> {
    await this.sendCommand('shell supervisorctl restart chromium', deviceId)
  }

  public async pushWebApp(deviceId: string, sourcePath: string): Promise<void> {
    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Remounting filesystem', 60)
    await this.sendCommand('shell mount -o remount,rw /', deviceId)

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Moving existing webapp', 65)
    await this.sendCommand('shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig', deviceId)

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Remounting', 70)
    await this.sendCommand('shell rm -r /tmp/webapp-orig', deviceId)

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Pushing new webapp', 80)
    await this.sendCommand(`push "${sourcePath}/" /usr/share/qt-superbird-app/webapp`, deviceId)
  }

  public async getDeviceManifest(deviceId: string): Promise<ClientManifest | null> {
    const response = await this.sendCommand(
      `shell cat /usr/share/qt-superbird-app/webapp/manifest.json`,
      deviceId
    )
    return JSON.parse(response) as ClientManifest
  }

  public async getDeviceManifestVersion(deviceId: string): Promise<string> {
    try {
      const manifestData = await this.getDeviceManifest(deviceId)
      return manifestData?.version || '0.0.0'
    } catch (error) {
      logger.error('Error getting device manifest version:', {
        error: error as Error
      })
      return '0.0.0'
    }
  }

  private async checkForClient(): Promise<boolean> {
    const userDataPath = app.getPath('userData')
    const manifestPath = join(userDataPath, 'webapp', 'manifest.json')
    return fs.existsSync(manifestPath)
  }

  public async configureDevice(
    deviceId: string,
    port: number,
    forcePush: boolean = false
  ): Promise<void> {
    progressBus.start(ProgressChannel.CONFIGURE_DEVICE, 'Configure Device', 'Opening port')

    await this.openPort(deviceId, port)

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Finding Client', 10)

    const clientExists = await this.checkForClient()
    if (!clientExists) {
      progressBus.error(ProgressChannel.CONFIGURE_DEVICE, 'Client not found', 'Client not found')
      throw new Error('Client not found')
    }

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Getting device version', 20)

    const deviceVersion = await this.getDeviceManifestVersion(deviceId)
    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Getting device manifest', 30)
    const clientManifest = await getClientManifest()

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Checking for updates', 40)

    if (clientManifest && (deviceVersion !== clientManifest.version || forcePush)) {
      progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Extracting webapp', 40)
      const userDataPath = app.getPath('userData')
      const extractDir = join(userDataPath, 'webapp')

      // Modify the manifest
      await setManifestJS({
        connectionId: deviceId,
        context: {
          method: ClientConnectionMethod.ADB,
          name: 'Car Thing',
          id: 4,
          ip: 'localhost',
          port: 8891,
          adbId: deviceId
        }
      })

      await updateManifest({
        connectionId: deviceId,
        context: {
          method: ClientConnectionMethod.ADB,
          name: 'Car Thing',
          id: 4,
          ip: 'localhost',
          port: 8891,
          adbId: deviceId
        }
      })

      progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Pushing webapp', 50)
      await this.pushWebApp(deviceId, extractDir)

      // revert the manifest changes
      await setManifestJS({
        connectionId: clientManifest.connectionId,
        context: clientManifest.context
      })
    }

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Restarting Chromium', 90)
    await this.restartChromium(deviceId)
    progressBus.complete(ProgressChannel.CONFIGURE_DEVICE, 'Configuration complete!')
  }

  public async getDeviceVersion(deviceId: string): Promise<string> {
    try {
      const versionResponse = await this.sendCommand('shell cat /etc/superbird/version', deviceId)
      if (versionResponse) {
        const versionMatch = versionResponse.match(/SHORT_VERSION\s+(\S+)/)
        if (versionMatch) {
          return versionMatch[1].trim()
        }
      }
      return '0.0.0'
    } catch (error) {
      logger.error('Failed to get device version', {
        error: error as Error,
        function: 'getDeviceVersion',
        source: 'ADBService'
      })
      return '0.0.0'
    }
  }

  public async getDeviceUSID(deviceId: string): Promise<string | undefined> {
    try {
      const usidResponse = await this.sendCommand('shell cat /sys/class/efuse/usid', deviceId)
      return usidResponse?.trim()
    } catch (error) {
      logger.error('Failed to get device USID', {
        error: error as Error,
        function: 'getDeviceUSID',
        source: 'ADBService'
      })
      return undefined
    }
  }

  public async getDeviceMacBT(deviceId: string): Promise<string | undefined> {
    try {
      const macBtResponse = await this.sendCommand('shell cat /sys/class/efuse/mac_bt', deviceId)
      return macBtResponse
        ?.split('\n')
        .map((line) => line.trim())
        .join(' ')
    } catch (error) {
      logger.error('Failed to get device MAC BT', {
        error: error as Error,
        function: 'getDeviceMacBT',
        source: 'ADBService'
      })
      return undefined
    }
  }

  public async setBrightness(deviceId: string, value: number): Promise<void> {
    const transformedValue = Math.round(245 - (value * (245 - 1)) / 100)
    await this.sendCommand(
      `shell echo ${transformedValue} > /sys/devices/platform/backlight/backlight/aml-bl/brightness`,
      deviceId
    )
  }

  public async restartDevice(deviceId: string): Promise<void> {
    await this.sendCommand('shell reboot', deviceId)
  }

  public async shutdownDevice(deviceId: string): Promise<void> {
    await this.sendCommand('shell poweroff', deviceId)
  }

  public async getSupervisorStatus(deviceId: string): Promise<Record<string, string>> {
    const response = await this.sendCommand('shell supervisorctl status', deviceId)
    const supervisorData: Record<string, string> = {}
    response.split('\n').forEach((line) => {
      const [name, status] = line.trim().split(/\s+/)
      if (name && status) {
        supervisorData[name] = status
      }
    })
    logger.debug(`Supervisor status: ${JSON.stringify(supervisorData)}`, {
      domain: 'adbService',
      function: 'getSupervisorStatus'
    })
    return supervisorData
  }

  public async toggleSupervisorService(
    deviceId: string,
    key: string,
    value: boolean
  ): Promise<void> {
    const action = value ? 'start' : 'stop'
    await this.sendCommand(`shell supervisorctl ${action} ${key}`, deviceId)
  }
}

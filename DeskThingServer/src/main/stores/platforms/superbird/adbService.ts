import { handleAdbCommands } from '../../../handlers/adbHandler'
import logger from '@server/utils/logger'
import { ClientConnectionMethod } from '@deskthing/types'
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
import { ProgressChannel, SCRIPT_IDs, ScriptConfig } from '@shared/types'
import { ADBServiceClass } from '@shared/stores/adbServiceClass'
import { restartScript } from '@server/services/adb/restartScript'
import { handleError } from '@server/utils/errorHandler'
import { proxyScript } from '@server/services/adb/proxyScript'
import { storeProvider } from '@server/stores/storeProvider'

export class ADBService implements ADBServiceClass {
  private commandQueues: {
    [deviceId: string]: {
      command: string
      resolve: (value: string) => void
      reject: (error: unknown) => void
    }[]
  } = {}
  private blacklist: string[] = []

  constructor() {
    this.initialize()
  }

  private initialize = async (): Promise<void> => {
    const settingStore = await storeProvider.getStore('settingsStore')
    const blacklist = await settingStore.getSetting('adb_blacklist')

    this.blacklist = blacklist || []

    settingStore.on('adb_blacklist', (blacklist) => {
      this.blacklist = blacklist || []
    })
  }

  public async sendCommand(command: string, deviceId?: string): Promise<string> {
    const queueKey = deviceId || 'default'

    if (deviceId && this.blacklist.includes(deviceId)) {
      logger.warn(`Blocked ADB command for blacklisted device: ${deviceId}`, {
        function: 'sendCommand',
        source: 'ADBService'
      })
      return Promise.reject(new Error(`Device ${deviceId} is blacklisted`))
    }

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

  public async runScript(scriptId: SCRIPT_IDs, scriptConfig: ScriptConfig): Promise<string> {
    try {
      switch (scriptId) {
        case SCRIPT_IDs.RESTART: {
          logger.info(`Running Restart Script on device ${scriptConfig.deviceId}`, {
            function: 'runScript',
            source: 'ADBService'
          })
          const result = await restartScript(this, scriptConfig)
          logger.info(
            `Completed Restart Script for ${scriptConfig.deviceId} with result: ${result}`,
            {
              function: 'runScript',
              source: 'ADBService'
            }
          )
          return result
        }
        case SCRIPT_IDs.PROXY: {
          logger.info(`Running Proxy Script on device ${scriptConfig.deviceId}`, {
            function: 'runScript',
            source: 'ADBService'
          })
          const result = await proxyScript(this, scriptConfig)
          logger.info(
            `Completed Proxy Script for ${scriptConfig.deviceId} with result: ${result}`,
            {
              function: 'runScript',
              source: 'ADBService'
            }
          )
          return result
        }
      }
    } catch (error) {
      logger.error(`Error running script ${scriptId} on device ${scriptConfig.deviceId}`, {
        error: error as Error,
        function: 'runScript',
        source: 'ADBService'
      })
      return handleError(error)
    }
  }

  public async getDevices(): Promise<string[]> {
    try {
      const response = await this.sendCommand('devices -l')
      const lines = response
        .split('\n')
        .filter(
          (line) => line && !line.startsWith('List of devices attached') && line.trim() !== ''
        )

      const adbDevices: string[] = lines.reduce((acc, line) => {
        if (line.includes('device')) {
          const deviceId = line.replace('device', '').trim()

          const adbId = deviceId.split(' ')[0]

          return [...acc, adbId]
        } else {
          return acc
        }
      }, [] as string[])

      const filteredDevices = adbDevices.filter((deviceId) => !this.blacklist.includes(deviceId))

      return filteredDevices
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
    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Remounting filesystem', 60)
    await this.sendCommand('shell mount -o remount,rw /', deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Moving existing webapp', 65)
    await this.sendCommand('shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig', deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Remounting', 70)
    await this.sendCommand('shell rm -r /tmp/webapp-orig', deviceId)

    progressBus.update(ProgressChannel.PUSH_SCRIPT, 'Pushing new webapp', 80)
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
    forcePush: boolean = false,
    attempts: number = 0
  ): Promise<void> {
    progressBus.start(ProgressChannel.CONFIGURE_DEVICE, 'Configure Device', 'Opening port')

    await this.openPort(deviceId, port)

    progressBus.update(ProgressChannel.CONFIGURE_DEVICE, 'Finding Client', 10)

    const clientExists = await this.checkForClient()
    if (!clientExists) {
      if (attempts > 2) {
        progressBus.error(
          ProgressChannel.CONFIGURE_DEVICE,
          'Reached max attempts',
          'Client not found'
        )
        throw new Error('Client not found and was not able to be downloaded automatically')
      }

      progressBus.warn(
        ProgressChannel.CONFIGURE_DEVICE,
        'Attempting to download latest',
        'Client not found'
      )

      const clientStore = await storeProvider.getStore('clientStore')

      const clientManifest = await clientStore.downloadLatestClient()

      if (!clientManifest) {
        throw new Error('Client not found and was not able to be downloaded automatically')
      }

      this.configureDevice(deviceId, port, forcePush, attempts + 1)
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

  /**
   * Sets the device screen brightness for a specific device.
   *
   * @param deviceId The unique identifier of the device
   * @param value Brightness level from 0-100 (percentage)
   * @throws {Error} If the command to set brightness fails
   */
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

  /**
   * Retrieves the current screen brightness of a specific device.
   *
   * @param deviceId The unique identifier of the device
   * @returns A number representing the brightness level from 0-100 (percentage)
   * @throws {Error} If the command to read brightness fails
   */
  public async getDeviceBrightness(deviceId: string): Promise<number> {
    const response = await this.sendCommand(
      'shell cat /sys/devices/platform/backlight/backlight/aml-bl/brightness',
      deviceId
    )
    const transformedValue = parseInt(response)
    return Math.round((245 - transformedValue) * (100 / 245))
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
    progressBus.startOperation(
      ProgressChannel.ST_ADB_SUPERVISOR,
      'Toggling Supervisor',
      'Toggling Supervisor',
      [
        {
          channel: ProgressChannel.ADB,
          weight: 100
        }
      ]
    )

    const action = value ? 'start' : 'stop'
    try {
      await this.sendCommand(`shell supervisorctl ${action} ${key}`, deviceId)
      progressBus.complete(ProgressChannel.ST_ADB_SUPERVISOR, 'Completed Successfully')
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_ADB_SUPERVISOR,
        handleError(error),
        handleError(error),
        'Error toggling supervisor'
      )
    }
  }
}

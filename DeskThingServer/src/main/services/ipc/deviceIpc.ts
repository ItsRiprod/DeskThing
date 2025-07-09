import { storeProvider } from '@server/stores/storeProvider'
import {
  AutoConfigResult,
  DeviceHandlerReturnType,
  DeviceIPCData,
  FLASH_REQUEST,
  IPC_DEVICE_TYPES,
  ProgressChannel
} from '@shared/types'
import { progressBus } from '../events/progressBus'
import { handleError } from '@server/utils/errorHandler'
import logger from '@server/utils/logger'
import { ConnectionState, PlatformIDs } from '@deskthing/types'

type ClientHandlerMap = {
  [T in IPC_DEVICE_TYPES]: (
    data: Extract<DeviceIPCData, { type: T }>
  ) => Promise<DeviceHandlerReturnType<T>>
}

export const deviceHandler: ClientHandlerMap = {
  [IPC_DEVICE_TYPES.FLASH_GET]: async (data) => {
    const flashStore = await storeProvider.getStore('flashStore')

    switch (data.request) {
      case FLASH_REQUEST.STEPS:
        return await flashStore.getFlashSteps()
      case FLASH_REQUEST.STATE:
        return await flashStore.getFlashStatus()
      case FLASH_REQUEST.DEVICE_SELECTION:
        return []
    }
  },
  [IPC_DEVICE_TYPES.FLASH_SET]: async (data) => {
    switch (data.request) {
      case FLASH_REQUEST.FILE_PATH:
        return ''
      case FLASH_REQUEST.DEVICE_SELECTION:
        return ''
    }
  },
  [IPC_DEVICE_TYPES.FLASH_OPERATION]: async (data) => {
    const flashStore = await storeProvider.getStore('flashStore')

    switch (data.request) {
      case 'start': {
        progressBus.startOperation(
          ProgressChannel.IPC_DEVICES,
          'Flashing Device',
          'Initializing Flash',
          [
            {
              channel: ProgressChannel.ST_FLASH_RUNNER,
              weight: 100
            }
          ]
        )
        try {
          const thingifyStore = await storeProvider.getStore('thingifyStore')

          const filePath = thingifyStore.getStagedFilePath()

          return await flashStore.startFlash(filePath)
        } catch (error) {
          progressBus.error(
            ProgressChannel.IPC_DEVICES,
            'Error flashing device',
            handleError(error)
          )
          return
        }
      }
      case 'usbmode': {
        progressBus.startOperation(
          ProgressChannel.IPC_DEVICES,
          'Flashing Device',
          'Initializing Flash',
          [
            {
              channel: ProgressChannel.ST_FLASH_RUNNER,
              weight: 100
            }
          ]
        )
        try {
          const thingifyStore = await storeProvider.getStore('thingifyStore')

          const filePath = thingifyStore.getStagedFilePath()

          return await flashStore.configureUSBMode(filePath)
        } catch (error) {
          progressBus.error(
            ProgressChannel.IPC_DEVICES,
            'Error flashing device',
            handleError(error)
          )
          return
        }
      }
      case 'cancel':
        logger.debug('Cancelling flash', {
          function: 'cancelFlash',
          source: 'deviceIpc'
        })
        return await flashStore.cancelFlash()
      case 'restart':
        logger.error('Restart not implemented')
        return
      case 'unbrick':
        logger.error('Unbrick not implemented')
        return
      case 'driver':
        return await flashStore.configureDriverForDevice()
      case 'autoconfig':
        return handleAutoConfig(data.payload)
    }
  },
  [IPC_DEVICE_TYPES.THINGIFY_GET]: async (data) => {
    const thingifyStore = await storeProvider.getStore('thingifyStore')
    switch (data.request) {
      case 'firmware':
        return await thingifyStore.getAvailableFirmware()
      case 'versions':
        return await thingifyStore.getAvailableFiles(data.payload)
      case 'file':
        return await thingifyStore.getStagedFileName()
      case 'files':
        return await thingifyStore.getAvailableStagedFiles()
    }
  },
  [IPC_DEVICE_TYPES.THINGIFY_SET]: async (data) => {
    const thingifyStore = await storeProvider.getStore('thingifyStore')
    switch (data.request) {
      case 'download':
        return await thingifyStore.startDownload(data.payload.version, data.payload.file)
      case 'upload':
        return await thingifyStore.upload(data.payload)
      case 'file':
        return await thingifyStore.selectStagedFile(data.payload)
      case 'latest':
        progressBus.startOperation(
          ProgressChannel.IPC_DEVICES,
          'Downloading Recommneded Firmware',
          'Initializing download...',
          [
            {
              channel: ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD,
              weight: 100
            }
          ]
        )
        try {
          const file = await thingifyStore.downloadRecommendedFirmware()

          return {
            status: true,
            statusText: `Successfully downloaded ${file}`,
            operationText: 'Download Success'
          }
        } catch (error) {
          progressBus.error(
            ProgressChannel.IPC_DEVICES,
            'Error downloading recommended firmware',
            handleError(error)
          )
          return {
            status: false,
            statusText: `Failed to download the recommended version`,
            operationText: handleError(error)
          }
        }
    }
  }
}

const handleAutoConfig = async (step: number): Promise<AutoConfigResult> => {
  const resolutionSteps: string[] = []
  const flashStore = await storeProvider.getStore('flashStore')

  switch (step) {
    case 0: // in case they accidentally 0-index the number
    case 1:
      progressBus.startOperation(
        ProgressChannel.IPC_DEVICES,
        'Flashing Device',
        'Initializing Flash',
        [
          {
            channel: ProgressChannel.ST_THINGIFY_RECOMMENDED_DOWNLOAD,
            weight: 25
          },
          {
            channel: ProgressChannel.ST_FLASH_DRIVER,
            weight: 25
          },
          {
            channel: ProgressChannel.ST_FLASH_RUNNER,
            weight: 50
          }
        ]
      )

      try {
        const thingifyStore = await storeProvider.getStore('thingifyStore')

        const filePath = await thingifyStore.downloadRecommendedFirmware().catch((error) => {
          resolutionSteps.push('Try uploading the file manually')
          resolutionSteps.push('Make sure you have a stable internet connection')
          resolutionSteps.push(
            `Try downloading manually from https://github.com/ItsRiprod/DeskThing-Firmwares/releases/tag/v8.9.2 and uploading the zip file `
          )
          throw error
        })

        try {
          await flashStore.configureDriverForDevice()
        } catch (error) {
          progressBus.warn(
            ProgressChannel.IPC_DEVICES,
            'Encountered an error downloading the drivers! Continuing anyways',
            handleError(error),
            'Installing Drivers'
          )
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }

        progressBus.update(ProgressChannel.IPC_DEVICES, 'Waiting 3 seconds before flashing...')
        await new Promise((resolve) => setTimeout(resolve, 3000))

        progressBus.update(ProgressChannel.IPC_DEVICES, `Flashing with path ${filePath}`)
        await flashStore.startFlash(filePath).catch((error) => {
          resolutionSteps.push('Try a different port on your computer')
          resolutionSteps.push('Try a different cable. USB A - C works best')
          resolutionSteps.push('Try a different computer for step alone')
          resolutionSteps.push('Try running the configuration process manually (not autoconfig)')
          resolutionSteps.push('Try restarting your computer')
          resolutionSteps.push(
            'Try manually installing the GX-CHIP driver with zadig (video tutorial around the 8 minute mark: https://youtu.be/RxUmyFUajiE)'
          )
          resolutionSteps.push(
            'Try using the BIOS port on your motherboard (look up the motherboard, it should be marked)'
          )
          resolutionSteps.push('Try using https://terbium.app/ to do the flashing process')

          throw error
        })

        progressBus.complete(ProgressChannel.IPC_DEVICES, 'Successfully flashed device!')
        return {
          state: 'input',
          inputText:
            'Unplug and Plug In your Car Thing then run the following configuration to finish the setup!',
          nextStep: 2
        }
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_DEVICES,
          'Error autoconfiguring device',
          handleError(error)
        )
        return {
          state: 'error',
          errorText: error instanceof Error ? error.message : 'Encountered an Unknown Error',
          resolutionSteps: [
            ...resolutionSteps,
            'Unplug and plug in your device holding buttons 1&4 then try again',
            'If all else fails, join the discord at https://deskthing.app/discord'
          ]
        }
      }
    case 2:
      try {
        const platformStore = await storeProvider.getStore('platformStore')

        const update = progressBus.start(
          ProgressChannel.IPC_DEVICES,
          'Flashing Device',
          'Initializing Flash'
        )

        update('Refreshing ADB devices', 10)
        await platformStore.sendPlatformData({
          platform: PlatformIDs.ADB,
          type: 'refresh',
          request: 'adb'
        })

        update('Getting the new ADB devices', 20)

        const devices = await platformStore.sendPlatformData({
          platform: PlatformIDs.ADB,
          type: 'get',
          request: 'devices'
        })

        if (!devices) {
          update('No devices found', 30)
          resolutionSteps.push(
            'Try going to the main Clients page and hitting Refresh - then hit Configure next to the device'
          )
          throw new Error('No ADB devices found')
        }
        const disconnectedDevices = devices.filter(
          (device) => device.connectionState != ConnectionState.Connected
        )

        if (disconnectedDevices.length > 1) {
          logger.debug(
            `${disconnectedDevices.length} devices disconnected. Choosing first one ${disconnectedDevices[0].clientId}`
          )
        }

        const configClient = disconnectedDevices[0]

        if (!disconnectedDevices[0]) {
          resolutionSteps.push(
            'Try going to the main Clients page and hitting Refresh - then hit Configure next to the device'
          )
          throw new Error('No disconnected devices found')
        }

        update(`Found device ${configClient.clientId}. Automatically configuring...`, 50)

        const success = await platformStore.sendPlatformData({
          platform: PlatformIDs.ADB,
          type: 'configure',
          request: 'client',
          adbId: configClient.identifiers.adb?.id || configClient.clientId
        })

        if (!success) {
          resolutionSteps.push(
            'Try going to the main Clients page and hitting Refresh - then hit Configure next to the device'
          )
          throw new Error('Failed to configure device')
        }

        update(`Successfully configured device ${configClient.clientId}`, 100)
        return {
          state: 'completed',
          successMessage: `Successfully configured device!`
        }
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_DEVICES,
          'Error refreshing devices',
          handleError(error)
        )
        return {
          state: 'error',
          errorText: error instanceof Error ? error.message : 'Encountered an Unknown Error',
          resolutionSteps: [
            ...resolutionSteps,
            'If all else fails, join the discord at https://deskthing.app/discord'
          ]
        }
      }
      break
    default:
      return {
        state: 'error',
        errorText: `Unknown step ${step}`,
        resolutionSteps: ['Try again with step 1']
      }
  }
}

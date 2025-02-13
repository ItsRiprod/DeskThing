console.log('[Device Handler] Starting')
import { sendIpcData } from '..'
import Logger from '@server/utils/logger'
import { join } from 'path'
import * as fs from 'fs'
import { app, net } from 'electron'
import { handleAdbCommands } from './adbHandler'
import { Client, ReplyData, ReplyFn } from '@shared/types'
import { ClientManifest, LOGGING_LEVELS } from '@DeskThing/types'
import settingsStore from '../stores/settingsStore'
import { getLatestRelease } from '../services/github/githubService'

/**
 * Handles device data received from the client.
 *
 * This function is responsible for processing the device data received from the client
 * and taking appropriate actions based on the type of data. Currently, it handles the
 * 'version_status' type and sends the data to the IPC channel for further processing.
 *
 * @param data - The device data received from the client as a JSON string.
 * @returns Promise<void>
 */
export const HandleDeviceData = async (data: string): Promise<void> => {
  try {
    const deviceData = JSON.parse(data)

    switch (deviceData.type) {
      case 'version_status':
        sendIpcData({
          type: 'version-status',
          payload: deviceData
        })
        break
      default:
        Logger.log(LOGGING_LEVELS.ERROR, 'HandleDeviceData Unable to find device version')
        break
    }
  } catch (Exception) {
    Logger.log(LOGGING_LEVELS.ERROR, 'HandleDeviceData encountered the error ' + Exception)
  }
}

/**
 * Retrieves the version of the device manifest.
 *
 * This function uses ADB commands to retrieve the contents of the device's manifest file,
 * and then extracts the version information from the response. If the version is not found
 * in the manifest, it returns '0.0.0'.
 *
 * @param deviceId - The ID of the device to retrieve the manifest version from.
 * @returns A Promise that resolves to the version string from the device manifest.
 */
export const getDeviceManifestVersion = async (deviceId: string): Promise<string> => {
  try {
    const manifestPath = '/usr/share/qt-superbird-app/webapp/manifest.js'
    const response = await handleAdbCommands(`-s ${deviceId} shell cat ${manifestPath}`)
    // Extract version from manifest content
    const versionMatch = response.match(/"version":\s*"(.+?)"/i)
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1]
    } else {
      throw new Error('Version not found in manifest')
    }
  } catch (error) {
    console.error('Error getting device manifest version:', error)
    return '0.0.0'
  }
}

/**
 * Configures a device by performing various setup tasks, such as opening a socket port,
 * checking for the client application, and pushing the web app to the device.
 *
 * @param deviceId - The ID of the device to configure.
 * @param reply - An optional callback function to send logging information back to the caller.
 * @returns A Promise that resolves when the device configuration is complete.
 */
export const configureDevice = async (deviceId: string, reply?: ReplyFn): Promise<void> => {
  const settings = await settingsStore.getSettings()

  // Opens the socket port
  try {
    if (settings && settings.devicePort) {
      console.error('Settings not found')
      reply && reply('logging', { status: true, data: 'Opening Port...', final: false })
      try {
        const response = await handleAdbCommands(
          `-s ${deviceId} reverse tcp:${settings.devicePort} tcp:${settings.devicePort}`,
          reply
        )
        reply && reply('logging', { status: true, data: response || 'Port Opened', final: false })
      } catch (error) {
        reply && reply('logging', { status: false, data: 'Unable to open port!', final: false })
      }
    } else {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to open port!',
          error: 'Device Port not found in settings',
          final: false
        })
    }
  } catch (error) {
    console.error('Error opening device port:', error)
    if (error instanceof Error) {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to open port!',
          error: error.message,
          final: false
        })
    }
  }

  // Check if the client is already installed. Install it if it is missing
  try {
    const clientExists = await checkForClient(reply)

    if (!clientExists) {
      // Download it from github
      const repos = settings.clientRepos
      reply && reply('logging', { status: true, data: 'Fetching Latest Client...', final: false })
      const latestReleases = await Promise.all(
        repos.map(async (repo) => {
          return await getLatestRelease(repo)
        })
      )

      // Sort releases by date and get the latest one
      const clientAsset = latestReleases
        .flatMap((release) =>
          release.assets.map((asset) => ({ ...asset, created_at: release.created_at }))
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .find((asset) => asset.name.includes('-client'))

      // Download it
      if (clientAsset) {
        reply && reply('logging', { status: true, data: 'Downloading Client...', final: false })
        await HandleWebappZipFromUrl(reply, clientAsset.browser_download_url)

        await new Promise((resolve) => {
          setTimeout(async () => {
            await checkForClient(reply)
            resolve(null)
          }, 5000)
        })
      } else {
        reply &&
          reply('logging', {
            status: false,
            data: 'No client asset found in latest releases',
            final: false
          })
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to check for client!',
          error: error.message,
          final: false
        })
    } else {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to check for client!',
          error: 'Unknown error',
          final: false
        })
    }
    console.error('Error checking for client:', error)
  }

  // Push the webapp to the device
  try {
    reply &&
      reply('logging', { status: true, data: 'Fetching Device Manifest Version...', final: false })
    const deviceManifestVersion = await getDeviceManifestVersion(deviceId)

    reply &&
      reply('logging', { status: true, data: 'Fetching Client Manifest Version...', final: false })
    const clientManifest = await getClientManifest(reply)
    if (
      clientManifest &&
      deviceManifestVersion &&
      deviceManifestVersion !== clientManifest.version
    ) {
      try {
        reply && reply('logging', { status: true, data: 'Pushing client...', final: false })
        // Give a 30 second timeout to flash the webapp
        await Promise.race([
          HandlePushWebApp(deviceId, reply),
          new Promise((_, reject) =>
            setTimeout(() => reject('Timeout: Operation took longer than 30 seconds'), 30000)
          )
        ])
      } catch (error) {
        reply &&
          reply('logging', {
            status: false,
            data: 'Unable to push webapp!',
            error: typeof error == 'string' ? error : 'Unknown Error',
            final: false
          })
      }
    } else {
      reply &&
        reply('logging', {
          status: true,
          data: 'Device has the same webapp version or doesnt exist!',
          final: false
        })
    }
  } catch (error) {
    if (error instanceof Error) {
      reply &&
        reply('logging', {
          status: false,
          error: error.message,
          data: 'Error pushing webapp!',
          final: false
        })
    } else {
      reply &&
        reply('logging', {
          status: false,
          error: 'Unknown Error',
          data: 'Error pushing webapp!',
          final: false
        })
    }
    console.error('Error pushing webapp', error)
  }

  try {
    reply && reply('logging', { status: true, data: 'Restarting Chromium', final: false })
    await handleAdbCommands(`-s ${deviceId} shell supervisorctl restart chromium`, reply)
  } catch (error) {
    if (error instanceof Error) {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to restart chromium!',
          error: error.message,
          final: false
        })
    } else {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to restart chromium!',
          error: 'Unknown Error',
          final: false
        })
    }
    console.error('Error restarting chromium', error)
  }
}

/**
 * Handles the process of pushing a web application to a device.
 *
 * This function performs the following steps:
 * 1. Checks if the client exists on the device.
 * 2. Remounts the device's file system as read-write.
 * 3. Moves the existing webapp to a temporary location.
 * 4. Moves the new webapp to the correct location.
 * 5. Removes the old webapp.
 * 6. Updates the client manifest with the device ID and type.
 * 7. Pushes the new webapp to the device.
 * 8. Restarts the Chromium process on the device.
 * 9. Syncs the files on the device.
 * 10. Updates the client manifest to remove the device ID and type.
 *
 * @param deviceId - The ID of the device to push the webapp to.
 * @param reply - An optional callback function to handle logging and status updates.
 * @returns A Promise that resolves when the webapp has been pushed to the device.
 */
export const HandlePushWebApp = async (
  deviceId: string,
  reply?: (channel: string, data: ReplyData) => void
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const extractDir = join(userDataPath, 'webapp')

    const clientExists = await checkForClient(reply)
    if (!clientExists) {
      reply &&
        reply('logging', {
          status: false,
          data: 'Unable to push webapp!',
          error: 'Client not found!',
          final: false
        })
      Logger.log(
        LOGGING_LEVELS.ERROR,
        '[HandlePushWebApp] Client Not Found! Ensure it is downloaded'
      )
      return
    }

    let response
    reply && reply('logging', { status: true, data: 'Remounting...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell mount -o remount,rw /`)
    reply && reply('logging', { status: true, data: response || 'Writing to tmp...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig`
    )
    reply &&
      reply('logging', { status: true, data: response || 'Moving from tmp...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/`
    )

    reply &&
      reply('logging', { status: true, data: response || 'Removing old app...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell rm -r /tmp/webapp-orig`)

    reply &&
      reply('logging', { status: true, data: response || 'Pushing client ID...', final: false })
    try {
      await handleClientManifestUpdate(
        { adbId: deviceId, device_type: { name: 'Car Thing', id: 4 } },
        reply
      )
    } catch (error) {
      console.error('Error updating client manifest:', error)
      reply &&
        reply('logging', {
          status: false,
          data: 'There has been an error updating the client manifests ID.',
          final: false,
          error: `${error}`
        })
    }

    reply &&
      reply('logging', { status: true, data: response || 'Pushing new app...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} push "${extractDir}/" /usr/share/qt-superbird-app/webapp`
    )

    reply &&
      reply('logging', { status: true, data: response || 'Restarting Chromium', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl restart chromium`)

    reply && reply('logging', { status: true, data: response || 'Syncing Files', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell sync`)

    reply &&
      reply('logging', { status: true, data: response || 'Cleaning up device ID...', final: false })
    try {
      await handleClientManifestUpdate(
        { adbId: undefined, device_type: { name: 'Unknown', id: 0 } },
        reply
      )
    } catch (error) {
      console.error('Error updating cleaning manifest:', error)
      reply &&
        reply('logging', {
          status: false,
          data: 'There has been an error cleaning the client manifests ID.',
          final: false,
          error: `${error}`
        })
    }

    reply && reply('logging', { status: true, data: await response, final: false })
  } catch (Exception) {
    if (Exception instanceof Error) {
      reply &&
        reply('logging', {
          status: false,
          data: 'Error while trying to push webapp!',
          final: false,
          error: Exception.message
        })
    } else {
      reply &&
        reply('logging', {
          status: false,
          data: 'Error while trying to push webapp!',
          final: false,
          error: `${Exception}`
        })
    }
    Logger.log(LOGGING_LEVELS.ERROR, 'HandlePushWebApp encountered the error ' + Exception)
  }
}

/**
 * Handles the download and extraction of a webapp zip file from a given URL.
 *
 * @param reply - An optional function to send logging updates to the frontend.
 * @param zipFileUrl - The URL of the zip file to download and extract.
 * @returns A Promise that resolves when the extraction is complete.
 */
export const HandleWebappZipFromUrl = async (
  reply: ReplyFn | undefined,
  zipFileUrl: string
): Promise<void> => {
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')

  // Create the extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true })
  }

  const AdmZip = await import('adm-zip')

  reply && reply('logging', { status: true, data: 'Downloading...', final: false })

  const request = net.request(zipFileUrl)

  request.on('response', (response) => {
    if (response.statusCode === 200) {
      const chunks: Buffer[] = []

      response.on('data', (chunk) => {
        chunks.push(chunk)
      })

      response.on('end', async () => {
        const buffer = Buffer.concat(chunks as unknown as Uint8Array[])
        const tempZipPath = join(extractDir, 'temp.zip')

        // Write the buffer to a temporary file
        fs.writeFileSync(tempZipPath, buffer as unknown as string)

        // Extract the downloaded zip file
        try {
          const zip = new AdmZip.default(tempZipPath)
          zip.extractAllTo(extractDir, true)

          // Optionally remove the temporary zip file
          fs.unlinkSync(tempZipPath)
          Logger.info(`Successfully extracted ${zipFileUrl} to ${extractDir}`)

          // Notify success to the frontend
          reply && reply('logging', { status: true, data: 'Success!', final: false })
        } catch (error) {
          console.error('Error extracting zip file:', error)
          Logger.log(LOGGING_LEVELS.ERROR, `Error extracting zip file: ${error}`)

          // Notify failure to the frontend
          reply &&
            reply('logging', {
              status: false,
              data: 'Failed to extract!',
              final: false,
              error: error instanceof Error ? error.message : String(error)
            })
        }
      })
      response.on('error', (error) => {
        console.error('Error downloading zip file:', error)
        Logger.log(LOGGING_LEVELS.ERROR, `Error downloading zip file: ${error}`)

        // Notify failure to the frontend
        reply &&
          reply('logging', {
            status: false,
            data: 'ERR Downloading file!',
            final: false,
            error: error.message
          })
      })
    } else {
      const errorMessage = `Failed to download zip file: ${response.statusCode}`
      console.error(errorMessage)
      Logger.log(LOGGING_LEVELS.ERROR, errorMessage)

      // Notify failure to the frontend
      reply &&
        reply('logging', {
          status: false,
          data: 'Failed to download zip file!',
          final: false,
          error: errorMessage
        })
    }
  })

  request.on('error', (error) => {
    console.error('Error sending request:', error)
    Logger.log(LOGGING_LEVELS.ERROR, `Error sending request: ${error}`)

    // Notify failure to the frontend
    reply &&
      reply('logging', {
        status: false,
        data: 'Failed to download zip file!',
        final: false,
        error: error.message
      })
  })

  request.end()
}

/**
 * Updates the client manifest file with the provided partial manifest data.
 *
 * @param partialManifest - The partial manifest data to be merged with the existing manifest.
 * @param reply - An optional callback function to provide logging updates.
 * @returns A Promise that resolves when the manifest file has been updated.
 */
export const handleClientManifestUpdate = async (
  partialManifest: Partial<Client>,
  reply?: (channel: string, data: ReplyData) => void
): Promise<void> => {
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')
  const manifestPath = join(extractDir, 'manifest.js')

  reply && reply('logging', { status: true, data: 'Updating manifest...', final: false })
  try {
    // Ensure the directory exists
    await fs.promises.mkdir(extractDir, { recursive: true })

    // Read the existing manifest
    const existingManifest = await getClientManifest(reply)

    // Merge the existing manifest with the partial updates
    const updatedManifest: Partial<Client> = {
      ...existingManifest,
      ...partialManifest
    }

    // Prepare the manifest content
    const manifestContent = `window.manifest = ${JSON.stringify(updatedManifest, null, 2)};`

    // Write the updated manifest to the file
    await fs.promises.writeFile(manifestPath, manifestContent, 'utf8')
    Logger.info('Manifest file updated successfully')
    reply && reply('logging', { status: true, data: 'Manifest Updated!', final: false })
    Logger.info('DEVICE HANDLER: Manifest file updated successfully')
  } catch (error) {
    console.error('Error updating manifest file:', error)
    Logger.log(LOGGING_LEVELS.ERROR, 'DEVICE HANDLER: Error updating manifest file: ' + error)
  }
}

/**
 * Checks if the client manifest file exists in the user's data directory.
 *
 * @param reply - An optional callback function to provide logging updates.
 * @returns A Promise that resolves to a boolean indicating whether the manifest file exists.
 */
export const checkForClient = async (
  reply?: (channel: string, data: ReplyData) => void
): Promise<boolean> => {
  reply && reply('logging', { status: true, data: 'Checking for client...', final: false })
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')
  const manifestPath = join(extractDir, 'manifest.js')

  const manifestExists = fs.existsSync(manifestPath)
  if (!manifestExists) {
    Logger.info('Manifest file not found')
    reply &&
      reply('logging', {
        status: false,
        data: 'Manifest file not found',
        final: false
      })
    Logger.log(LOGGING_LEVELS.ERROR, 'DEVICE HANDLER: Manifest file not found')
  }
  return manifestExists
}

/**
 * Retrieves the client manifest from the user's data directory.
 *
 * @param reply - An optional callback function to provide logging updates.
 * @returns A Promise that resolves to the client manifest, or null if the manifest file is not found or cannot be parsed.
 */
export const getClientManifest = async (
  reply?: (channel: string, data: ReplyData) => void
): Promise<ClientManifest | null> => {
  Logger.info('Getting manifest...')
  const userDataPath = app.getPath('userData')
  const manifestPath = join(userDataPath, 'webapp', 'manifest.js')
  Logger.info('manifestPath: ' + manifestPath)
  if (!fs.existsSync(manifestPath)) {
    Logger.info('Manifest file not found')
    reply &&
      reply('logging', {
        status: false,
        error: 'Unable to find the client manifest!',
        data: 'Manifest file not found',
        final: false
      })
    Logger.log(
      LOGGING_LEVELS.ERROR,
      'DEVICE HANDLER: Client is not detected or downloaded! Please download the client! (downloads -> client)'
    )
    return null
  }
  reply &&
    reply('logging', {
      status: true,
      data: 'Manifest file read successfully',
      final: false
    })

  try {
    const data = await fs.promises.readFile(manifestPath, 'utf8')

    const jsonStart = data.indexOf('{')
    const jsonEnd = data.lastIndexOf('}')
    const jsonData = data.substring(jsonStart, jsonEnd + 1)

    const manifest: ClientManifest = JSON.parse(jsonData)
    reply &&
      reply('logging', {
        status: true,
        data: 'Manifest loaded!',
        final: false
      })
    Logger.info('DEVICE HANDLER: Manifest file read successfully')
    return manifest
  } catch (error) {
    console.error('Error reading or parsing manifest file:', error)
    Logger.log(
      LOGGING_LEVELS.ERROR,
      'DEVICE HANDLER: Error reading or parsing manifest file: ' + error
    )
    reply &&
      reply('logging', {
        status: false,
        data: 'Unable to read Server Manifest file',
        final: false,
        error: 'Unable to read manifest file' + error
      })
    return null
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'
const scriptDir = isDevelopment
  ? join(__dirname, '..', '..', 'resources', 'scripts')
  : join(process.resourcesPath, 'scripts')

/**
 * Sets up a proxy configuration on the device by uploading a setup script, creating a Supervisor configuration file, and starting the proxy program.
 *
 * @deprecated - Do not use this. It is untested and the functionality of it is unknown.
 * @param reply - A function to provide logging and feedback during the setup process.
 * @param deviceId - The ID of the device to set up the proxy on.
 * @returns A Promise that resolves when the proxy setup is complete.
 */
export const SetupProxy = async (
  reply: (channel: string, data: ReplyData) => void,
  deviceId: string
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const scriptPath = join(scriptDir, 'setup-proxy.sh')
    const tempProxyConfPath = join(userDataPath, 'proxy.conf')

    const tempScriptPath = '/tmp/setup-proxy.sh'
    const targetScriptPath = '/etc/setup-proxy.sh'
    const proxyConfPath = '/etc/supervisor.d/setup-proxy.conf'

    // Check if setup-proxy.sh exists in the application directory
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script ${scriptPath} does not exist.`)
    }

    // Upload setup-proxy.sh script
    reply('logging', { status: true, data: 'Uploading setup-proxy.sh...', final: false })
    let response = await handleAdbCommands(`-s ${deviceId} push "${scriptPath}"  ${tempScriptPath}`)
    reply('logging', { status: true, data: response || 'Uploaded setup-proxy.sh.', final: false })

    // Set executable permissions for the script
    response = await handleAdbCommands(`-s ${deviceId} shell chmod +x ${tempScriptPath}`)
    reply('logging', {
      status: true,
      data: response || 'Set executable permissions for setup-proxy.sh.',
      final: false
    })

    Logger.info('Remounting...')
    reply('logging', { status: true, data: 'Remounting...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell mount -o remount,rw /`)

    response = await handleAdbCommands(
      `-s ${deviceId} shell mv ${tempScriptPath} ${targetScriptPath}`
    )
    reply('logging', {
      status: true,
      data: response || 'Moved setup-proxy.sh to /etc/.',
      final: false
    })

    try {
      await EnsureSupervisorInclude(reply, deviceId)
    } catch (error) {
      console.error('Error ensuring supervisor include:', error)
      reply('logging', {
        status: false,
        data: 'Error ensuring supervisor include: ' + error,
        error: 'Error ensuring supervisor include: ' + error,
        final: false
      })
    }

    // Create Supervisor configuration file
    reply('logging', { status: true, data: 'Creating Supervisor configuration...', final: false })
    const supervisorConfig = `[program:setupProxy]
command=${targetScriptPath}
autostart=true
autorestart=true
stderr_logfile=/var/log/setup-proxy.err.log
stdout_logfile=/var/log/setup-proxy.out.log
user=root`

    // Write Supervisor configuration to file
    reply('logging', { status: true, data: 'Uploading Supervisor configuration...', final: false })

    fs.writeFileSync(tempProxyConfPath, supervisorConfig)

    response = await handleAdbCommands(
      `-s ${deviceId} push "${tempProxyConfPath}" ${proxyConfPath}`
    )
    reply('logging', {
      status: true,
      data: response || 'Uploaded Supervisor configuration.',
      final: false
    })

    // Reread and update Supervisor
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl reread`)
    reply('logging', {
      status: true,
      data: response || 'Supervisor reread configuration.',
      final: false
    })
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl update`)
    reply('logging', {
      status: true,
      data: response || 'Supervisor updated configuration.',
      final: false
    })
    // Start the Supervisor program
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl start setupProxy`)
    reply('logging', {
      status: true,
      data: response || 'Started setup-proxy program.',
      final: false
    })

    fs.unlinkSync(tempProxyConfPath)
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: 'There has been an error setting up the proxy.',
      final: false,
      error: `${Exception}`
    })
    Logger.log(LOGGING_LEVELS.ERROR, 'SetupProxy encountered the error ' + Exception)
    throw new Error('SetupProxy encountered the error ' + Exception)
  }
}

/**
 * Not Currently in use
 * Does not work
 * Do not use this
 * @param reply The reply function for logging and feedback
 * @param deviceId the device id to run this on
 * @param filePath the path  to the file to add to supervisor
 */
export const AppendToSupervisor = async (
  reply: (channel: string, data: ReplyData) => void,
  deviceId: string,
  filePath: string
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const tempConfPath = join(userDataPath, 'temp_supervisor.conf')
    const supervisorConfPath = '/etc/supervisord.conf'

    // Pull existing Supervisor configuration
    reply('logging', {
      status: true,
      data: 'Pulling existing Supervisor configuration...',
      final: false
    })
    let response = await handleAdbCommands(
      `-s ${deviceId} pull ${supervisorConfPath} "${tempConfPath}"`
    )
    reply('logging', {
      status: true,
      data: response || 'Pulled Supervisor configuration.',
      final: false
    })

    // Read the existing and new configuration
    const existingConf = fs.readFileSync(tempConfPath, 'utf8')
    const newConf = fs.readFileSync(filePath, 'utf8')

    // Check if new configuration is already present
    const newConfLines = newConf.split('\n').filter((line) => line.trim())
    const existingConfLines = existingConf.split('\n').filter((line) => line.trim())

    // Identify if new configuration already exists in the existing config
    const newConfigExists = newConfLines.some((newLine) =>
      existingConfLines.some((existingLine) => existingLine.includes(newLine.split(':')[0]))
    )

    if (newConfigExists) {
      // Remove existing configuration if present
      reply('logging', {
        status: true,
        data: 'Updating existing Supervisor configuration...',
        final: false
      })

      // Remove existing configuration block from the temp file
      const updatedConf = existingConfLines
        .filter((line) => !newConfLines.some((newLine) => line.includes(newLine.split(':')[0])))
        .join('\n')

      fs.writeFileSync(tempConfPath, updatedConf + '\n' + newConf)
    } else {
      // Append new configuration
      reply('logging', { status: true, data: 'Appending new configuration...', final: false })
      fs.writeFileSync(tempConfPath, existingConf + '\n' + newConf)
    }

    // Push updated configuration
    reply('logging', {
      status: true,
      data: 'Uploading updated Supervisor configuration...',
      final: false
    })

    response = await handleAdbCommands(
      `-s ${deviceId} push "${tempConfPath}" ${supervisorConfPath}`
    )
    reply('logging', {
      status: true,
      data: response || 'Uploaded updated Supervisor configuration.',
      final: false
    })

    // Apply Supervisor configuration
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl reread`)
    reply('logging', {
      status: true,
      data: response || 'Supervisor reread configuration.',
      final: false
    })

    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl update`)
    reply('logging', {
      status: true,
      data: response || 'Supervisor updated configuration.',
      final: false
    })

    reply('logging', {
      status: true,
      data: 'Supervisor configuration updated and applied.',
      final: false
    })
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: `Error appending to Supervisor: ${Exception}`,
      final: false,
      error: `${Exception}`
    })
    Logger.log(LOGGING_LEVELS.ERROR, 'AppendToSupervisor encountered the error ' + Exception)
  }
}

/**
 * Ensures that the Supervisor configuration includes the [include] file necessary.
 * @param reply
 * @param deviceId
 */
export const EnsureSupervisorInclude = async (
  reply: (channel: string, data: ReplyData) => void,
  deviceId: string
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const tempConfPath = join(userDataPath, 'temp_supervisor.conf')
    const supervisorConfPath = '/etc/supervisord.conf'

    // Pull existing Supervisor configuration
    reply('logging', {
      status: true,
      data: 'Pulling existing Supervisor configuration...',
      final: false
    })
    let response = await handleAdbCommands(
      `-s ${deviceId} pull ${supervisorConfPath} "${tempConfPath}"`
    )
    reply('logging', {
      status: true,
      data: response || 'Pulled Supervisor configuration.',
      final: false
    })

    // Read the existing configuration
    const existingConf = fs.readFileSync(tempConfPath, 'utf8')

    // Check if [include] section is present
    const includeSectionRegex = /^\[include\]\s*$/m
    const includeSectionPresent = includeSectionRegex.test(existingConf)

    if (!includeSectionPresent) {
      // Append [include] section if not present
      const includeSection = `[include]
files = /etc/supervisor.d/*.conf\n`
      const updatedConf = existingConf + '\n' + includeSection

      // Write the updated configuration to a temporary file
      fs.writeFileSync(tempConfPath, updatedConf)

      // Push updated configuration
      reply('logging', {
        status: true,
        data: 'Uploading updated Supervisor configuration...',
        final: false
      })
      response = await handleAdbCommands(
        `-s ${deviceId} push "${tempConfPath}" ${supervisorConfPath}`
      )
      reply('logging', {
        status: true,
        data: response || 'Uploaded updated Supervisor configuration.',
        final: false
      })

      // Apply Supervisor configuration
      response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl reread`)
      reply('logging', {
        status: true,
        data: response || 'Supervisor reread configuration.',
        final: false
      })

      response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl update`)
      reply('logging', {
        status: true,
        data: response || 'Supervisor updated configuration.',
        final: false
      })
    } else {
      reply('logging', {
        status: true,
        data: '[include] section already present. No need to update.',
        final: false
      })
    }
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: `Error ensuring Supervisor [include] section: ${Exception}`,
      final: false,
      error: `${Exception}`
    })
    Logger.log(LOGGING_LEVELS.ERROR, 'EnsureSupervisorInclude encountered the error ' + Exception)
  }
}

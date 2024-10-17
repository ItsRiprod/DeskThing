import { sendIpcData } from '..'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { join } from 'path'
import * as fs from 'fs'
import { app, net } from 'electron'
import { handleAdbCommands } from './adbHandler'
import { Client, ReplyData } from '@shared/types'

export const HandleDeviceData = async (data: any): Promise<void> => {
  try {
    const deviceData = JSON.parse(data)

    switch (deviceData.type) {
      case 'version_status':
        sendIpcData('version-status', deviceData)
        break
      default:
        console.log('Unhandled response', deviceData)
        break
    }
  } catch (Exception) {
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'HandleDeviceData encountered the error ' + Exception
    )
  }
}
export const HandlePushWebApp = async (
  deviceId: string,
  reply?: (channel: string, data: ReplyData) => void
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const extractDir = join(userDataPath, 'webapp')
    let response
    console.log('Remounting...')
    reply && reply('logging', { status: true, data: 'Remounting...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell mount -o remount,rw /`)
    reply && reply('logging', { status: true, data: response || 'Moving...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig`
    )
    reply && reply('logging', { status: true, data: response || 'Moving...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/`
    )

    reply &&
      reply('logging', { status: true, data: response || 'Removing old app...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell rm -r /tmp/webapp-orig`)

    reply &&
      reply('logging', { status: true, data: response || 'Pushing new app...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} push "${extractDir}/" /usr/share/qt-superbird-app/webapp`
    )

    reply &&
      reply('logging', { status: true, data: response || 'Restarting Chromium', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl restart chromium`)

    reply && reply('logging', { status: true, data: response, final: true })
  } catch (Exception) {
    reply &&
      reply('logging', {
        status: false,
        data: 'There has been an error',
        final: true,
        error: `${Exception}`
      })
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'HandlePushWebApp encountered the error ' + Exception
    )
  }
}

export const HandleWebappZipFromUrl = async (
  reply: (channel: string, data: ReplyData) => void,
  zipFileUrl: string
): Promise<void> => {
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')

  // Create the extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true })
  }

  const AdmZip = await import('adm-zip')

  reply('logging', { status: true, data: 'Downloading...', final: false })

  const request = net.request(zipFileUrl)

  request.on('response', (response) => {
    if (response.statusCode === 200) {
      const chunks: Buffer[] = []

      response.on('data', (chunk) => {
        chunks.push(chunk)
      })

      response.on('end', async () => {
        const buffer = Buffer.concat(chunks)
        const tempZipPath = join(extractDir, 'temp.zip')

        // Write the buffer to a temporary file
        fs.writeFileSync(tempZipPath, buffer)

        // Extract the downloaded zip file
        try {
          const zip = new AdmZip.default(tempZipPath)
          zip.extractAllTo(extractDir, true)

          // Optionally remove the temporary zip file
          fs.unlinkSync(tempZipPath)

          console.log(`Successfully extracted ${zipFileUrl} to ${extractDir}`)
          dataListener.asyncEmit(
            MESSAGE_TYPES.LOGGING,
            `Successfully extracted ${zipFileUrl} to ${extractDir}`
          )

          // Notify success to the frontend
          reply('logging', { status: true, data: 'Success!', final: true })
        } catch (error) {
          console.error('Error extracting zip file:', error)
          dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error extracting zip file: ${error}`)

          // Notify failure to the frontend
          reply('logging', {
            status: false,
            data: 'Failed to extract!',
            final: true,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      })

      response.on('error', (error) => {
        console.error('Error downloading zip file:', error)
        dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error downloading zip file: ${error}`)

        // Notify failure to the frontend
        reply('logging', {
          status: false,
          data: 'ERR Downloading file!',
          final: true,
          error: error.message
        })
      })
    } else {
      const errorMessage = `Failed to download zip file: ${response.statusCode}`
      console.error(errorMessage)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, errorMessage)

      // Notify failure to the frontend
      reply('logging', {
        status: false,
        data: 'Failed to download zip file!',
        final: true,
        error: errorMessage
      })
    }
  })

  request.on('error', (error) => {
    console.error('Error sending request:', error)
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error sending request: ${error}`)

    // Notify failure to the frontend
    reply('logging', {
      status: false,
      data: 'Failed to download zip file!',
      final: true,
      error: error.message
    })
  })

  request.end()
}

export const handleClientManifestUpdate = async (
  send: (channel: string, data: ReplyData) => void,
  partialManifest: Partial<Client>
): Promise<void> => {
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')
  const manifestPath = join(extractDir, 'manifest.js')

  send('logging', { status: true, data: 'Updating manifest...', final: false })
  try {
    // Ensure the directory exists
    await fs.promises.mkdir(extractDir, { recursive: true })

    // Read the existing manifest
    const existingManifest = await getClientManifest(send, true)

    // Merge the existing manifest with the partial updates
    const updatedManifest: Partial<Client> = {
      ...existingManifest,
      ...partialManifest
    }

    // Prepare the manifest content
    const manifestContent = `window.manifest = ${JSON.stringify(updatedManifest, null, 2)};`

    // Write the updated manifest to the file
    await fs.promises.writeFile(manifestPath, manifestContent, 'utf8')
    console.log('Manifest file updated successfully')
    send('logging', { status: true, data: 'Manifest Updated!', final: true })
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      'DEVICE HANDLER: Manifest file updated successfully'
    )
  } catch (error) {
    console.error('Error updating manifest file:', error)
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'DEVICE HANDLER: Error updating manifest file: ' + error
    )
  }
}

export const getClientManifest = async (
  send: (channel: string, data: ReplyData) => void,
  utility: boolean = false
): Promise<Client | null> => {
  console.log('Getting manifest...')
  const userDataPath = app.getPath('userData')
  const manifestPath = join(userDataPath, 'webapp', 'manifest.js')
  console.log('manifestPath: ', manifestPath)
  if (!fs.existsSync(manifestPath)) {
    console.log('Manifest file not found')
    send('logging', {
      status: false,
      data: 'Manifest file not found',
      final: true
    })
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'DEVICE HANDLER: Client Manifest file not found! (Is the client downloaded?)'
    )
    return null
  }
  send('logging', {
    status: true,
    data: 'Manifest file read successfully',
    final: false
  })

  try {
    const data = await fs.promises.readFile(manifestPath, 'utf8')

    const jsonStart = data.indexOf('{')
    const jsonEnd = data.lastIndexOf('}')
    const jsonData = data.substring(jsonStart, jsonEnd + 1)

    const manifest: Client = JSON.parse(jsonData)
    send('logging', {
      status: true,
      data: 'Manifest loaded!',
      final: !utility
    })
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'DEVICE HANDLER: Manifest file read successfully')
    console.log(manifest)
    return manifest
  } catch (error) {
    console.error('Error reading or parsing manifest file:', error)
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'DEVICE HANDLER: Error reading or parsing manifest file: ' + error
    )
    send('logging', {
      status: false,
      data: 'Unable to read Server Manifest file',
      final: true,
      error: 'Unable to read manifest file' + error
    })
    return null
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'
const scriptDir = isDevelopment
  ? join(__dirname, '..', '..', 'resources', 'scripts')
  : join(process.resourcesPath, 'scripts')

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

    console.log('Remounting...')
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
        final: true
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
      final: true
    })
    // Start the Supervisor program
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl start setupProxy`)
    reply('logging', {
      status: true,
      data: response || 'Started setup-proxy program.',
      final: true
    })

    fs.unlinkSync(tempProxyConfPath)
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: 'There has been an error setting up the proxy.',
      final: true,
      error: `${Exception}`
    })
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'SetupProxy encountered the error ' + Exception)
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
      final: true
    })
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: `Error appending to Supervisor: ${Exception}`,
      final: true,
      error: `${Exception}`
    })
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'AppendToSupervisor encountered the error ' + Exception
    )
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
        final: true
      })
    } else {
      reply('logging', {
        status: true,
        data: '[include] section already present. No need to update.',
        final: true
      })
    }
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: `Error ensuring Supervisor [include] section: ${Exception}`,
      final: true,
      error: `${Exception}`
    })
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      'EnsureSupervisorInclude encountered the error ' + Exception
    )
  }
}

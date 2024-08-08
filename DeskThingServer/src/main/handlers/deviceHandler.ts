import { sendIpcData } from '..'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { join } from 'path'
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import { app, net } from 'electron'
import { handleAdbCommands } from './adbHandler'
import { ReplyData } from '..'

export interface ServerManifest {
  name: string
  id: string
  short_name: string
  description: string
  builtFor: string
  reactive: boolean
  author: string
  version: string
  port: number
  ip: string
}

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
  reply: (channel: string, data: ReplyData) => void,
  deviceId: string
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const extractDir = join(userDataPath, 'webapp')
    let response
    console.log('Remounting...')
    reply('logging', { status: true, data: 'Remounting...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell mount -o remount,rw /`)
    reply('logging', { status: true, data: response || 'Moving...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig`
    )
    reply('logging', { status: true, data: response || 'Moving...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/`
    )

    reply('logging', { status: true, data: response || 'Removing old app...', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell rm -r /tmp/webapp-orig`)

    reply('logging', { status: true, data: response || 'Pushing new app...', final: false })
    response = await handleAdbCommands(
      `-s ${deviceId} push "${extractDir}/" /usr/share/qt-superbird-app/webapp`
    )

    reply('logging', { status: true, data: response || 'Restarting Chromium', final: false })
    response = await handleAdbCommands(`-s ${deviceId} shell supervisorctl restart chromium`)

    reply('logging', { status: true, data: response, final: true })
  } catch (Exception) {
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

export const HandleWebappZipFromUrl = (
  reply: (channel: string, data: ReplyData) => void,
  zipFileUrl: string
): void => {
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')

  // Create the extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true })
  }

  // Download the zip file from the provided URL
  const request = net.request(zipFileUrl)

  request.on('response', (response) => {
    if (response.statusCode === 200) {
      const writeStream = fs.createWriteStream(join(extractDir, 'temp.zip'))

      response.on('data', (chunk) => {
        writeStream.write(chunk)
      })

      response.on('end', async () => {
        writeStream.end()

        // Extract the downloaded zip file
        try {
          await fs
            .createReadStream(join(extractDir, 'temp.zip'))
            .pipe(unzipper.Extract({ path: extractDir }))
            .promise()

          // Optionally remove the temporary zip file
          fs.unlinkSync(join(extractDir, 'temp.zip'))

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
            error: 'No error provided'
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
  webContents,
  partialManifest: Partial<ServerManifest>
): Promise<void> => {
  const userDataPath = app.getPath('userData')
  const extractDir = join(userDataPath, 'webapp')
  const manifestPath = join(extractDir, 'manifest.js')

  webContents.send('logging', { status: true, data: 'Updating manifest...', final: false })
  try {
    // Ensure the directory exists
    await fs.promises.mkdir(extractDir, { recursive: true })

    // Read the existing manifest
    const existingManifest = await getClientManifest(webContents, true)

    // Merge the existing manifest with the partial updates
    const updatedManifest: Partial<ServerManifest> = {
      ...existingManifest,
      ...partialManifest
    }

    // Prepare the manifest content
    const manifestContent = `window.manifest = ${JSON.stringify(updatedManifest, null, 2)};`

    // Write the updated manifest to the file
    await fs.promises.writeFile(manifestPath, manifestContent, 'utf8')
    console.log('Manifest file updated successfully')
    webContents.send('logging', { status: true, data: 'Manifest Updated!', final: true })
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
  webContents,
  utility: boolean = false
): Promise<ServerManifest | null> => {
  console.log('Getting manifest...')
  const userDataPath = app.getPath('userData')
  const manifestPath = join(userDataPath, 'webapp', 'manifest.js')
  console.log('manifestPath: ', manifestPath)
  if (!fs.existsSync(manifestPath)) {
    console.log('Manifest file not found')
    webContents.send('logging', {
      status: false,
      data: 'Manifest file not found',
      final: true
    })
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'DEVICE HANDLER: Manifest file not found')
    return null
  }
  webContents.send('logging', {
    status: true,
    data: 'Manifest file read successfully',
    final: false
  })

  try {
    const data = await fs.promises.readFile(manifestPath, 'utf8')

    const jsonStart = data.indexOf('{')
    const jsonEnd = data.lastIndexOf('}')
    const jsonData = data.substring(jsonStart, jsonEnd + 1)

    const manifest: ServerManifest = JSON.parse(jsonData)
    webContents.send('logging', {
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
    webContents.send('logging', {
      status: false,
      data: 'Unable to read Server Manifest file',
      final: true,
      error: 'Unable to read manifest file' + error
    })
    return null
  }
}

import { sendIpcData } from '..'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { join } from 'path'
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import { app, net } from 'electron'
import { handleAdbCommands } from './adbHandler'
import { ReplyData } from '..'

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
    dataListener.emit(MESSAGE_TYPES.ERROR, 'HandleDeviceData encountered the error ' + Exception)
  }
}
export const HandlePushWebApp = async (
  reply: (channel: string, data: ReplyData) => void
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const extractDir = join(userDataPath, 'webapp')
    let response
    console.log('Remounting...')
    reply('logging', { status: true, data: 'Remounting...', final: false })
    response = await handleAdbCommands('shell mount -o remount,rw /')
    reply('logging', { status: true, data: response || 'Moving...', final: false })
    response = await handleAdbCommands(
      'shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig'
    )
    reply('logging', { status: true, data: response || 'Moving...', final: false })
    response = await handleAdbCommands('shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/')

    reply('logging', { status: true, data: response || 'Removing old app...', final: false })
    response = await handleAdbCommands('shell rm -r /tmp/webapp-orig')

    reply('logging', { status: true, data: response || 'Pushing new app...', final: false })
    response = await handleAdbCommands(`push ${extractDir}/ /usr/share/qt-superbird-app/webapp`)

    reply('logging', { status: true, data: response || 'Restarting Chromium', final: false })
    response = await handleAdbCommands('shell supervisorctl restart chromium')

    reply('logging', { status: true, data: response, final: true })
  } catch (Exception) {
    reply('logging', {
      status: false,
      data: 'There has been an error',
      final: true,
      error: `${Exception}`
    })
    dataListener.emit(MESSAGE_TYPES.ERROR, 'HandlePushWebApp encountered the error ' + Exception)
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
          dataListener.emit(
            MESSAGE_TYPES.LOGGING,
            `Successfully extracted ${zipFileUrl} to ${extractDir}`
          )

          // Notify success to the frontend
          reply('logging', { status: true, data: 'Success!', final: true })
        } catch (error) {
          console.error('Error extracting zip file:', error)
          dataListener.emit(MESSAGE_TYPES.ERROR, `Error extracting zip file: ${error}`)

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
        dataListener.emit(MESSAGE_TYPES.ERROR, `Error downloading zip file: ${error}`)

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
      dataListener.emit(MESSAGE_TYPES.ERROR, errorMessage)

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
    dataListener.emit(MESSAGE_TYPES.ERROR, `Error sending request: ${error}`)

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

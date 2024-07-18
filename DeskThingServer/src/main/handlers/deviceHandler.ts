import { sendIpcData } from '..'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { join } from 'path'
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import { app, net } from 'electron'
import { handleAdbCommands } from './adbHandler'

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
  reply: (data: string, payload: any) => void
): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')
    const extractDir = join(userDataPath, 'webapp')
    await handleAdbCommands('shell mount -o remount,rw /')
    await handleAdbCommands('shell mv /usr/share/qt-superbird-app/webapp /tmp/webapp-orig')
    await handleAdbCommands('shell mv /tmp/webapp-orig /usr/share/qt-superbird-app/')
    await handleAdbCommands('shell rm -r /tmp/webapp-orig')
    await handleAdbCommands(`push ${extractDir}/ /usr/share/qt-superbird-app/webapp`)
    await handleAdbCommands('shell supervisorctl restart chromium')
    reply('pushed-staged', { success: true })
  } catch (Exception) {
    reply('pushed-staged', { success: false, error: Exception })
    dataListener.emit(MESSAGE_TYPES.ERROR, 'HandlePushWebApp encountered the error ' + Exception)
  }
}

export const HandleWebappZipFromUrl = (
  reply: (data: string, payload: any) => void,
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
          reply('zip-extracted', { success: true })
        } catch (error) {
          console.error('Error extracting zip file:', error)
          dataListener.emit(MESSAGE_TYPES.ERROR, `Error extracting zip file: ${error}`)

          // Notify failure to the frontend
          reply('zip-extracted', { success: false, error: error })
        }
      })

      response.on('error', (error) => {
        console.error('Error downloading zip file:', error)
        dataListener.emit(MESSAGE_TYPES.ERROR, `Error downloading zip file: ${error}`)

        // Notify failure to the frontend
        reply('zip-extracted', { success: false, error: error.message })
      })
    } else {
      const errorMessage = `Failed to download zip file: ${response.statusCode}`
      console.error(errorMessage)
      dataListener.emit(MESSAGE_TYPES.ERROR, errorMessage)

      // Notify failure to the frontend
      reply('zip-extracted', { success: false, error: errorMessage })
    }
  })

  request.on('error', (error) => {
    console.error('Error sending request:', error)
    dataListener.emit(MESSAGE_TYPES.ERROR, `Error sending request: ${error}`)

    // Notify failure to the frontend
    reply('zip-extracted', { success: false, error: error.message })
  })

  request.end()
}

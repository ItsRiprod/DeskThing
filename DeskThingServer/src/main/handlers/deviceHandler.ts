import { sendIpcData } from '..'
import dataListener, { MESSAGE_TYPES } from '../utils/events'

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

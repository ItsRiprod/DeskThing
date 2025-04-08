import { DeviceIPCData } from '@shared/types'
import Logger from '@server/utils/logger'

export const deviceHandler = async (data: DeviceIPCData): Promise<void> => {
  Logger.warn(`Device IPC handler not implemented. Unable to handle ${data.type}`, {
    domain: 'ipc',
    source: 'deviceHandler'
  })
}

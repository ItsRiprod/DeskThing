console.log('[ClientUtils Service] Starting')
import loggingStore from '@server/stores/loggingStore'
import { sendMessageToClients } from './clientCom'
import { MESSAGE_TYPES } from '@shared/types'

const getDelayToNextMinute = async (): Promise<number> => {
  const now = new Date()
  const seconds = now.getSeconds()
  const milliseconds = now.getMilliseconds()
  return (60 - seconds) * 1000 - milliseconds
}

export const getDeviceType = (userAgent: string | undefined): { id: number; name: string } => {
  if (!userAgent) return { id: 0, name: 'unknown' }
  userAgent = userAgent.toLowerCase()
  if (userAgent.includes('iphone')) return { id: 3, name: 'iphone' }
  if (userAgent.includes('win')) return { id: 1, name: 'windows' }
  if (userAgent.includes('ipad')) return { id: 2, name: 'tablet' }
  if (userAgent.includes('mac')) return { id: 1, name: 'mac' }
  if (userAgent.includes('android')) {
    if (userAgent.includes('mobile')) return { id: 3, name: 'android' }
    return { id: 2, name: 'tablet' }
  }
  return { id: 0, name: 'unknown' }
}

export const sendTime = async (): Promise<void> => {
  const now = new Date()
  const utcTime = Date.now() // UTC time in milliseconds
  const timezoneOffset = now.getTimezoneOffset() * -1 // Offset in minutes (server's timezone)

  const data = {
    utcTime, // UTC timestamp
    timezoneOffset // Timezone offset in minutes
  }

  loggingStore.log(MESSAGE_TYPES.DEBUG, 'Sending time:' + JSON.stringify(data))

  sendMessageToClients({ app: 'client', type: 'set', request: 'time', payload: data })
}

const initializeTimer = async (): Promise<void> => {
  setTimeout(
    () => {
      // Send time immediately at the full minute
      sendTime()

      // Set an interval to send time every minute
      setInterval(() => sendTime(), 60000)
    },
    await getDelayToNextMinute()
  )
}

initializeTimer()

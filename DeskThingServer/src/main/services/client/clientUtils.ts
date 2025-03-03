console.log('[ClientUtils Service] Starting')
import { ClientDeviceType } from '@deskthing/types'
import { sendMessageToClients } from './clientCom'

/**
 * Calculates the delay in milliseconds until the next full minute.
 * @returns {Promise<number>} The delay in milliseconds until the next full minute.
 */
const getDelayToNextMinute = async (): Promise<number> => {
  const now = new Date()
  const seconds = now.getSeconds()
  const milliseconds = now.getMilliseconds()
  return (60 - seconds) * 1000 - milliseconds
}

/**
 * Determines the device type based on the provided user agent string.
 * @param userAgent - The user agent string to analyze.
 * @returns An object with the device type ID and name.
 */
export const getDeviceType = (userAgent: string | undefined): ClientDeviceType => {
  if (!userAgent) return { method: 1, id: 0, name: 'unknown' }

  userAgent = userAgent.toLowerCase()
  // Desktops
  if (userAgent.includes('linux')) return { method: 1, id: 1, name: 'linux' }
  if (userAgent.includes('win')) return { method: 1, id: 1, name: 'windows' }
  if (userAgent.includes('mac')) return { method: 1, id: 1, name: 'mac' }
  if (userAgent.includes('chromebook')) return { method: 1, id: 1, name: 'chromebook' }

  // Tablets
  if (userAgent.includes('ipad')) return { method: 1, id: 2, name: 'tablet' }
  if (userAgent.includes('webos')) return { method: 1, id: 2, name: 'webos' }
  if (userAgent.includes('kindle')) return { method: 1, id: 2, name: 'kindle' }

  // Mobile
  if (userAgent.includes('iphone')) return { method: 1, id: 3, name: 'iphone' }
  if (userAgent.includes('android')) {
    if (userAgent.includes('mobile')) return { method: 1, id: 3, name: 'android' }
    return { method: 1, id: 2, name: 'tablet' }
  }
  if (userAgent.includes('firefox os')) return { method: 1, id: 3, name: 'firefox-os' }
  if (userAgent.includes('blackberry')) return { method: 1, id: 3, name: 'blackberry' }
  if (userAgent.includes('windows phone')) return { method: 1, id: 3, name: 'windows-phone' }

  // Default to unknown
  return { method: 1, id: 0, name: 'unknown' }
}
/**
 * Sends the current time to connected clients.
 * This function retrieves the current UTC time and the server's timezone offset,
 * then sends this information to all connected clients using the `sendMessageToClients` function.
 * The time information is logged at the DEBUG level using the `Logger`.
 */
export const sendTime = async (): Promise<void> => {
  const now = new Date()
  const utcTime = Date.now() // UTC time in milliseconds
  const timezoneOffset = now.getTimezoneOffset() * -1 // Offset in minutes (server's timezone)

  const data = {
    utcTime, // UTC timestamp
    timezoneOffset // Timezone offset in minutes
  }

  sendMessageToClients({ app: 'client', type: 'set', request: 'time', payload: data })
}

/**
 * Initializes a timer that sends the current time to connected clients.
 * This function calculates the delay until the next full minute, then sends the time immediately.
 * It also sets an interval to send the time every minute.
 */
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

import { sendMessageToClients } from './clientCom'

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
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes
  const time = `${formattedHours}:${formattedMinutes} ${ampm}`
  sendMessageToClients({ app: 'client', type: 'time', payload: time })
  console.log(time)
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

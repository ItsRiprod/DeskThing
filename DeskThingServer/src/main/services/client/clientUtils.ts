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

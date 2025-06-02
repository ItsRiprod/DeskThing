import os from 'os'

/**
 * Retrieves the local IP addresses of the system, excluding internal and certain reserved IP addresses.
 * @returns An array of local IP addresses as strings.
 */
export const getLocalIpAddresses = (): string[] => {
  const interfaces = os.networkInterfaces()
  const localIps: string[] = []

  if (!interfaces) {
    return ['127.0.0.1']
  }

  for (const name of Object.keys(interfaces)) {
    const ifaceGroup = interfaces[name]
    if (ifaceGroup) {
      for (const iface of ifaceGroup) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (
            iface.address.startsWith('10.') ||
            (iface.address.startsWith('172.') &&
              parseInt(iface.address.split('.')[1]) >= 16 &&
              parseInt(iface.address.split('.')[1]) <= 31) ||
            iface.address.startsWith('192.168.')
          ) {
            localIps.push(iface.address)
          }
        }
      }
    }
  }
  if (localIps.length === 0) {
    localIps.push('127.0.0.1')
  }
  return localIps
}

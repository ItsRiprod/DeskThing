import { getLocalIpAddresses } from '@server/utils/address'
import { Settings, LOG_FILTER } from '@shared/types'
import { app } from 'electron'

export const defaultSettings: Settings = {
  version: app.getVersion(),
  // server
  server_LogLevel: LOG_FILTER.INFO,
  server_autoStart: false,
  server_startMinimized: false,
  server_minimizeApp: true,
  server_localIp: getLocalIpAddresses(),
  server_callbackPort: 8888,

  // device
  device_devicePort: 8891,
  device_address: '0.0.0.0',

  // music
  music_playbackLocation: 'none',
  music_refreshInterval: -1,

  // adb
  adb_useGlobal: false,
  adb_autoConfig: false,
  adb_autoDetect: false,
  adb_blacklist: [],

  // flags
  flag_firstClose: true,
  flag_hasOpened: false,
  flag_collectStats: true
}

import { getLocalIpAddresses } from '@server/utils/address'
import { Settings, LOG_FILTER, LOG_CONTEXTS } from '@shared/types'
import { app } from 'electron'

export const defaultSettings: Settings = {
  version: app.getVersion(),
  // server
  server_LogLevel: LOG_FILTER.INFO,
  server_LogContext: [LOG_CONTEXTS.APP, LOG_CONTEXTS.CLIENT, LOG_CONTEXTS.SERVER],
  server_autoStart: false,
  server_startMinimized: false,
  server_minimizeApp: true,
  server_localIp: getLocalIpAddresses(),
  server_callbackPort: 8888,

  // audio agent info
  voice_agent_app_ids: [],

  // device
  device_devicePort: 8891,
  device_address: '0.0.0.0',

  // music
  music_refreshInterval: 15000,
  music_control_id: '', // not implemented
  music_sources_ids: [], // not implemented
  // depreciated once source and control are implemented
  music_playbackLocation: 'none',

  // adb
  adb_useGlobal: false,
  adb_autoConfig: false,
  adb_autoDetect: true,
  adb_blacklist: [],

  // flags
  flag_firstClose: true,
  flag_hasOpened: false,
  flag_collectStats: true,
  flag_nerd: false,
}

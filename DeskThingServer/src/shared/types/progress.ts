export enum ProgressChannel {
  FIREWALL = 'firewall',
  DOWNLOAD = 'download',
  SERVER = 'server',
  TASK = 'task',
  INSTALL = 'install',

  // Client Channels

  /** The Process of installing a client */
  ST_CLIENT_INSTALL = 'store-client-install',
  ST_CLIENT_DOWNLOAD = 'store-client-download',
  ST_CLIENT_REFRESH = 'store-client-refresh',
  /** The Process of installing a client */
  FN_CLIENT_INSTALL = 'fn-client-install',

  // App Channels

  /** The process of staging an app */
  FN_APP_INSTALL = 'fn-app-install',
  /** The process of running a staged app */
  FN_APP_POSTINSTALL = 'fn-app-postinstall',
  FN_APP_INITIALIZE = 'fn-app-initialize',

  ST_APP_INSTALL = 'st-app-install',
  ST_APP_INITIALIZE = 'st-app-initialize',

  // Platforms

  /** The process of communicating with the device via ADB */
  ADB = 'adb',
  /** Fetches the client manifest */
  CLIENT_MANIFEST = 'client-manifest',
  /** Pushes the staged client */
  CONFIGURE_DEVICE = 'configure-device',
  PUSH_SCRIPT = 'push-script',
  REFRESH_DEVICES = 'refresh-devices',

  /** The channel for all platform-related events */
  PLATFORM_CHANNEL = 'ipc-platform-channel',

  /** The channel for all platform-related events */
  REFRESH_RELEASES = 'refresh-releases',
  REFRESH_CLIENTS = 'refresh-clients',
  PING = 'ping',
  REFRESH_APP_RELEASES = 'refresh-app-releases',
  REFRESH_CLIENT_RELEASES = 'refresh-client-releases',
  GET_CLIENT_RELEASES = 'get-client-releases',
  GET_APP_RELEASES = 'get-app-releases',
  PROCESS_APP_RELEASES = 'process-app-releases',

  // Release Functions
  ST_RELEASE_REFRESH = 'st-release-refresh',
  ST_RELEASE_ADD_REPO = 'st-releasae-add-repo',
  ST_RELEASE_APP_REMOVE = 'st-releasae-app-remove',
  ST_RELEASE_APP_DOWNLOAD = 'st-release-app-download',
  FN_RELEASE_ADD_REPO = 'fn-releasae-add-repo',
  FN_RELEASE_APP_REFRESH = 'fn-release-app-refresh',
  FN_RELEASE_APP_MIGRATE = 'fn-release-app-migrate',
  FN_RELEASE_APP_STATS = 'fn-release-app-stats',
  ST_RELEASE_CLIENT_REMOVE = 'st-releasae-client-remove',
  ST_RELEASE_APP_REFRESH = 'st-release-app-refresh',
  ST_RELEASE_CLIENT_REFRESH = 'st-release-client-refresh',
  ST_RELEASE_CLIENT_DOWNLOAD = 'st-release-client-download',
  FN_RELEASE_CLIENT_REFRESH = 'fn-release-client-refresh',
  FN_RELEASE_CLIENT_MIGRATE = 'fn-release-client-migrate',
  FN_RELEASE_CLIENT_STATS = 'fn-release-client-stats',

  // Top-Level routines

  /** IPC Channels */
  IPC_APPS = 'ipc-apps',
  IPC_CLIENT = 'ipc-client',
  IPC_DEVICES = 'ipc-devices',
  IPC_FEEDBACK = 'ipc-feedback',
  IPC_PLATFORM = 'ipc-platform',
  IPC_RELEASES = 'ipc-releases',
  IPC_TASKS = 'ipc-tasks',
  IPC_UPDATES = 'ipc-updates',
  IPC_UTILITY = 'ipc-utility'
}

export type ProgressEvent = {
  channel: ProgressChannel
  operation: string
  status: ProgressStatus
  message: string
  progress?: number
  metadata?: Record<string, unknown>
  lastUpdate?: number
  error?: string
  id?: string
  isLoading?: boolean
  timestamp?: number
}

export enum ProgressStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  INFO = 'info',
  WARN = 'warn',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export type ProgressOperation = ProgressEvent & {
  subOperations: Map<ProgressChannel, { weight: number; progress: number }>
  totalWeight: number
  startTime: number
}

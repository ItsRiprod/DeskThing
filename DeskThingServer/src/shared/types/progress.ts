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
  PUSH_PROXY_SCRIPT = 'push-proxy-script',
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
  progress?: number
  metadata?: Record<string, unknown>
  lastUpdate?: number
} & (
  | {
      status: ProgressStatus.ERROR
      error: string
      message: string
    }
  | {
      status: Exclude<ProgressStatus, ProgressStatus.ERROR>
      message: string
    }
)

export enum ProgressStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  INFO = 'info',
  WARN = 'warn',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface OperationContext {
  channel: ProgressChannel
  operation: string
  subOperations: Map<ProgressChannel, { weight: number; progressOffset: number }>
  totalWeight: number
  startTime: number
  parentContext: OperationContext | null
}

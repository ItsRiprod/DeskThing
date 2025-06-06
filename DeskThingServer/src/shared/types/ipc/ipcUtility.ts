import {
  Action,
  Button,
  Profile,
  ActionReference,
  Client,
  // ClientReleaseMeta,
  // AppReleaseCommunity,
  // AppReleaseMeta,
  // Step,
  // Task,
  Key,
  ButtonMapping
} from '@deskthing/types'
// import { FeedbackReport, SystemInfo } from '../feedback'
import { Log, Settings } from '../types'
import { IPC_HANDLERS } from './ipcTypes'
import { PaginatedResponse, SupporterData, SupporterFetchOptions } from '../supporter'
// import { FullTaskList } from '../taskTypes'

export enum IPC_UTILITY_TYPES {
  /** @deprecated */
  PING = 'ping',
  /** @deprecated */
  CONNECTIONS = 'connections',
  SETTINGS = 'settings',
  LOGS = 'logs',
  SHUTDOWN = 'shutdown',
  OPEN_LOG_FOLDER = 'open-log-folder',
  REFRESH_FIREWALL = 'refresh-firewall',
  /** @deprecated */
  RESTART_SERVER = 'restart-server',
  /** @deprecated */
  ZIP = 'zip',
  ACTIONS = 'actions',
  BUTTONS = 'buttons',
  KEYS = 'keys',
  PROFILES = 'profiles',
  RUN = 'run',
  MAP = 'map',
  SUPPORTERS = 'supporters'
  // FEEDBACK = 'feedback',
  // TASK = 'task',
  // UPDATE = 'update',
  // GITHUB = 'github'
}

export type UtilityIPCData = {
  kind: IPC_HANDLERS.UTILITY
} & (
  | { type: IPC_UTILITY_TYPES.PING }
  | { type: IPC_UTILITY_TYPES.ZIP }
  | {
      type: IPC_UTILITY_TYPES.CONNECTIONS
      request: 'get'
    }
  | {
      type: IPC_UTILITY_TYPES.CONNECTIONS
      request: 'delete'
      payload: string
    }
  | {
      type: IPC_UTILITY_TYPES.SETTINGS
      request: 'get'
    }
  | {
      type: IPC_UTILITY_TYPES.SETTINGS
      request: 'set'
      payload: Settings
    }
  | { type: IPC_UTILITY_TYPES.LOGS }
  | { type: IPC_UTILITY_TYPES.SHUTDOWN }
  | { type: IPC_UTILITY_TYPES.OPEN_LOG_FOLDER }
  | { type: IPC_UTILITY_TYPES.REFRESH_FIREWALL }
  | { type: IPC_UTILITY_TYPES.RESTART_SERVER }
  | {
      type: IPC_UTILITY_TYPES.ACTIONS
      request: 'get'
    }
  | {
      type: IPC_UTILITY_TYPES.ACTIONS
      request: 'set'
      payload: Action
    }
  | {
      type: IPC_UTILITY_TYPES.ACTIONS
      request: 'delete'
      payload: string
    }
  | {
      type: IPC_UTILITY_TYPES.BUTTONS
      request: 'set'
      payload: Button
    }
  | {
      type: IPC_UTILITY_TYPES.BUTTONS
      request: 'delete'
      payload: Button
    }
  | {
      type: IPC_UTILITY_TYPES.KEYS
      request: 'get'
    }
  | {
      type: IPC_UTILITY_TYPES.KEYS
      request: 'set'
      payload: Key
    }
  | {
      type: IPC_UTILITY_TYPES.KEYS
      request: 'delete'
      payload: string
    }
  | {
      type: IPC_UTILITY_TYPES.PROFILES
      request: 'get'
      payload: string
    }
  | {
      type: IPC_UTILITY_TYPES.PROFILES
      request: 'getAll'
    }
  | {
      type: IPC_UTILITY_TYPES.PROFILES
      request: 'set'
      payload: Profile
    }
  | {
      type: IPC_UTILITY_TYPES.PROFILES
      request: 'delete'
      payload: string
    }
  | {
      type: IPC_UTILITY_TYPES.MAP
      request: 'get'
    }
  | {
      type: IPC_UTILITY_TYPES.MAP
      request: 'set'
      payload: Profile
    }
  | {
      type: IPC_UTILITY_TYPES.RUN
      payload: Action | ActionReference
    }
  | {
      type: IPC_UTILITY_TYPES.SUPPORTERS
      payload: SupporterFetchOptions
      request: 'get'
    }
)
// | {
//     type: IPC_UTILITY_TYPES.FEEDBACK
//     request: 'set'
//     payload: FeedbackReport
//   }
// | {
//     type: IPC_UTILITY_TYPES.FEEDBACK
//     request: 'get'
//   }
// | {
//     type: IPC_UTILITY_TYPES.UPDATE
//     request: 'check'
//   }
// | {
//     type: IPC_UTILITY_TYPES.UPDATE
//     request: 'restart'
//   }
// | {
//     type: IPC_UTILITY_TYPES.UPDATE
//     request: 'download'
//   }
// | UtilityIPCTask
// | UtilityIPCGithub

// export type UtilityIPCGithub = {
//   type: IPC_UTILITY_TYPES.GITHUB
// } & (
//   | {
//       request: 'refreshApps'
//     }
//   | {
//       request: 'refreshApp'
//       payload: string
//     }
//   | {
//       request: 'getApps'
//     }
//   | {
//       request: 'getAppReferences'
//     }
//   | {
//       request: 'addAppRepo'
//       payload: string
//     }
//   | {
//       request: 'removeAppRepo'
//       payload: string
//     }
//   | {
//       request: 'getClients'
//     }
// )

// export type UtilityIPCTask = {
//   type: IPC_UTILITY_TYPES.TASK
// } & (
//   | {
//       request: 'complete_task'
//       payload: { source: string; taskId: string }
//     }
//   | {
//       request: 'start'
//       payload: { source: string; taskId: string }
//     }
//   | {
//       request: 'stop'
//       payload: { source: string; taskId: string }
//     }
//   | {
//       request: 'restart'
//       payload: { source: string; taskId: string }
//     }
//   | {
//       request: 'previous'
//       payload: { source: string; taskId: string }
//     }
//   | {
//       request: 'next'
//       payload: { source: string; taskId: string }
//     }
//   | {
//       request: 'complete'
//       payload: { source: string; taskId: string; stepId: string }
//     }
//   | {
//       request: 'get'
//     }
//   | {
//       request: 'pause'
//     }
//   | {
//       request: 'update-step'
//       payload: { source: string; taskId: string; newStep: Partial<Step> }
//     }
//   | {
//       request: 'update-task'
//       payload: { source: string; newTask: Partial<Task> }
//     }
// )

export type UtilityHandlerReturnMap = {
  [IPC_UTILITY_TYPES.PING]: { set: string }
  [IPC_UTILITY_TYPES.ZIP]: { set: string | undefined }
  [IPC_UTILITY_TYPES.CONNECTIONS]: { get: Client[]; delete: boolean }
  [IPC_UTILITY_TYPES.SETTINGS]: { get: Settings; set: void }
  [IPC_UTILITY_TYPES.LOGS]: { set: Log[] }
  [IPC_UTILITY_TYPES.SHUTDOWN]: { set: void }
  [IPC_UTILITY_TYPES.OPEN_LOG_FOLDER]: { set: void }
  [IPC_UTILITY_TYPES.REFRESH_FIREWALL]: { set: void }
  [IPC_UTILITY_TYPES.RESTART_SERVER]: { set: void }
  [IPC_UTILITY_TYPES.ACTIONS]: { get: Action[] | null; set: void; delete: void }
  [IPC_UTILITY_TYPES.BUTTONS]: { set: void; delete: void }
  [IPC_UTILITY_TYPES.KEYS]: { get: Key[] | null; set: void; delete: void }
  [IPC_UTILITY_TYPES.PROFILES]: {
    get: ButtonMapping | null
    getAll: Profile[]
    set: void
    delete: void
  }
  [IPC_UTILITY_TYPES.MAP]: { get: Profile | null; set: void; delete: void }
  [IPC_UTILITY_TYPES.RUN]: { set: void }
  [IPC_UTILITY_TYPES.SUPPORTERS]: { get: PaginatedResponse<SupporterData> }
  // [IPC_UTILITY_TYPES.FEEDBACK]: { set: void; get: SystemInfo }
  // [IPC_UTILITY_TYPES.TASK]: {
  //   get: FullTaskList
  //   stop: void
  //   complete: void
  //   start: void
  //   pause: void
  //   restart: void
  //   complete_task: void
  //   next: void
  //   previous: void
  //   'update-task': void
  //   'update-step': void
  // }
  // [IPC_UTILITY_TYPES.UPDATE]: { check: void; download: void; restart: void }
  // [IPC_UTILITY_TYPES.GITHUB]: {
  //   getClients: ClientReleaseMeta[]
  //   getAppReferences: AppReleaseCommunity[]
  //   getApps: AppReleaseMeta[] | AppReleaseMeta
  //   refreshApps: void
  //   refreshApp: void
  //   addAppRepo: AppReleaseMeta | void
  //   removeAppRepo: void
  // }
}

export type UtilityHandlerReturnType<
  K extends IPC_UTILITY_TYPES,
  R extends keyof UtilityHandlerReturnMap[K] = keyof UtilityHandlerReturnMap[K]
> = UtilityHandlerReturnMap[K][R]
